import type { TestContext } from 'node:test'
import { styleText } from 'node:util'

import { highlight } from '@babel/code-frame'
import {
  AmbiguousError,
  type AmbiguousStep,
  type AssembledTestStep,
  DataTable,
  type PreparedStep,
  type SupportCodeLibrary,
  UndefinedError,
  type UndefinedStep,
} from '@cucumber/core'
import type { TestStepResult } from '@cucumber/messages'

import { makeTimestamp } from '../makeTimestamp.js'
import { newId } from '../newId.js'
import type { TestCaseContext } from '../types.js'
import type { ExecutableTestCase } from './ExecutableTestCase.js'
import type { MessagesCollector } from './MessagesCollector.js'
import { makeSnippets } from './makeSnippets.js'

export class ExecutableTestStep {
  private readonly prepared: PreparedStep | UndefinedStep | AmbiguousStep

  constructor(
    private readonly messages: MessagesCollector,
    private readonly testCase: ExecutableTestCase,
    private readonly supportCodeLibrary: SupportCodeLibrary,
    private readonly assembledStep: AssembledTestStep
  ) {
    this.prepared = assembledStep.prepare()
  }

  get name(): string {
    return [styleText('bold', this.assembledStep.name.prefix), this.assembledStep.name.body]
      .filter(Boolean)
      .join(' ')
  }

  get options() {
    if (this.assembledStep.always) {
      return { skip: false }
    }
    switch (this.testCase.outcome) {
      case 'skipped':
        return { skip: true }
      case 'failedish':
        return { skip: this.prepared.type === 'prepared' }
      default:
        return { skip: false }
    }
  }

  async setup() {
    this.messages.push({
      testStepStarted: {
        testCaseStartedId: this.testCase.id,
        testStepId: this.assembledStep.id,
        timestamp: makeTimestamp(),
      },
    })
  }

  async execute(nodeTestContext: TestContext) {
    let success = false
    try {
      const prepared = this.prepared

      if (prepared.type === 'undefined') {
        const snippets = makeSnippets(prepared.pickleStep, this.supportCodeLibrary)
        this.messages.push({
          suggestion: {
            id: newId(),
            pickleStepId: prepared.pickleStep.id,
            snippets,
          },
        })
        throw new UndefinedError(
          prepared,
          snippets.map((snippet) => ({
            ...snippet,
            code: highlight(snippet.code),
          }))
        )
      } else if (prepared.type === 'ambiguous') {
        throw new AmbiguousError(prepared)
      }

      const { fn, args, dataTable, docString } = prepared
      const context = this.makeContext(nodeTestContext)
      const fnArgs: Array<unknown> = [context]
      const values = await Promise.all(args.map((arg) => arg.getValue(context)))
      fnArgs.push(...values)
      if (dataTable) {
        fnArgs.push(DataTable.from(dataTable))
      } else if (docString) {
        fnArgs.push(docString.content)
      }

      const returned = await fn.apply(context.world, fnArgs)
      if (returned === 'skipped') {
        context.skip()
      } else if (returned === 'pending') {
        context.todo()
      }
      success = true
    } finally {
      if (!success) {
        this.markFailedish()
      }
    }
  }

  private makeContext(nodeTestContext: TestContext): TestCaseContext {
    return {
      assert: nodeTestContext.assert,
      mock: nodeTestContext.mock,
      skip: () => {
        nodeTestContext.skip()
        this.testCase.outcome = 'skipped'
      },
      todo: () => {
        nodeTestContext.todo()
        this.markFailedish()
      },
      ...this.testCase.context,
    }
  }

  private markFailedish() {
    if (this.testCase.outcome === 'unknown') {
      this.testCase.outcome = 'failedish'
    }
  }

  async teardown() {
    this.messages.push({
      testStepFinished: {
        testCaseStartedId: this.testCase.id,
        testStepId: this.assembledStep.id,
        timestamp: makeTimestamp(),
        testStepResult: {} as TestStepResult,
      },
    })
  }
}
