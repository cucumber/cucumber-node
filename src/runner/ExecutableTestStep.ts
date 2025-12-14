import { TestContext } from 'node:test'
import { styleText } from 'node:util'

// @ts-expect-error incomplete types
import { highlight } from '@babel/code-frame'
import {
  AmbiguousError,
  AssembledTestStep,
  DataTable,
  SupportCodeLibrary,
  UndefinedError,
} from '@cucumber/core'
import { TestStepResult } from '@cucumber/messages'

import { makeTimestamp } from '../makeTimestamp.js'
import { newId } from '../newId.js'
import { TestCaseContext } from '../types.js'
import { ExecutableTestCase } from './ExecutableTestCase.js'
import { makeSnippets } from './makeSnippets.js'
import { messages } from './state.js'

export class ExecutableTestStep {
  constructor(
    private readonly testCase: ExecutableTestCase,
    private readonly supportCodeLibrary: SupportCodeLibrary,
    private readonly assembledStep: AssembledTestStep
  ) {}

  get name(): string {
    return [styleText('bold', this.assembledStep.name.prefix), this.assembledStep.name.body]
      .filter(Boolean)
      .join(' ')
  }

  get options() {
    return { skip: this.testCase.outcomeKnown && !this.assembledStep.always }
  }

  async setup() {
    messages.push({
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
      const prepared = this.assembledStep.prepare()

      if (prepared.type === 'undefined') {
        const snippets = makeSnippets(prepared.pickleStep, this.supportCodeLibrary)
        messages.push({
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
        this.testCase.outcomeKnown = true
      }
    }
  }

  private makeContext(nodeTestContext: TestContext): TestCaseContext {
    return {
      assert: nodeTestContext.assert,
      mock: nodeTestContext.mock,
      skip: () => {
        nodeTestContext.skip()
        this.testCase.outcomeKnown = true
      },
      todo: () => {
        nodeTestContext.todo()
        this.testCase.outcomeKnown = true
      },
      ...this.testCase.context,
    }
  }

  async teardown() {
    messages.push({
      testStepFinished: {
        testCaseStartedId: this.testCase.id,
        testStepId: this.assembledStep.id,
        timestamp: makeTimestamp(),
        testStepResult: {} as TestStepResult,
      },
    })
  }
}
