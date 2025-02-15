import { suite, test } from 'node:test'

import { GherkinDocument, Pickle, Source, TestStepResult } from '@cucumber/messages'

import { makeId } from '../makeId.js'
import { makeTimestamp } from '../makeTimestamp.js'
import { ContextTracker } from './ContextTracker.js'
import { loadSupport } from './loadSupport.js'
import { makeTestPlan } from './makeTestPlan.js'
import { messages } from './state.js'

interface CompiledGherkin {
  source: Source
  gherkinDocument: GherkinDocument
  pickles: ReadonlyArray<Pickle>
}

export function run({ source, gherkinDocument, pickles }: CompiledGherkin) {
  void suite(gherkinDocument.feature?.name, async () => {
    messages.push({ source })
    messages.push({ gherkinDocument })
    messages.push(...pickles.map((pickle) => ({ pickle })))

    const library = await loadSupport()
    messages.push(...library.toEnvelopes())

    const plan = makeTestPlan(pickles, library)
    messages.push(...plan.toEnvelopes())

    for (const item of plan.testCases) {
      const testCaseStartedId = makeId()

      await test(item.name, async (ctx1) => {
        messages.connect(ctx1)
        messages.push({
          testCaseStarted: {
            id: testCaseStartedId,
            testCaseId: item.id,
            attempt: 0,
            timestamp: makeTimestamp(),
          },
        })

        const world = {}
        const tracker = new ContextTracker(testCaseStartedId, world, (e) => messages.push(e))

        for (const step of item.steps) {
          messages.push({
            testStepStarted: {
              testCaseStartedId: testCaseStartedId,
              testStepId: step.id,
              timestamp: makeTimestamp(),
            },
          })

          await ctx1.test(
            step.name,
            { skip: tracker.outcomeKnown && !step.always },
            async (ctx2) => {
              let success = false
              try {
                const { fn, args } = step.prepare()
                await fn(tracker.makeContext(ctx2, step.id), ...args)
                success = true
              } finally {
                if (!success) {
                  tracker.outcomeKnown = true
                }
              }
            }
          )

          messages.push({
            testStepFinished: {
              testCaseStartedId: testCaseStartedId,
              testStepId: step.id,
              timestamp: makeTimestamp(),
              testStepResult: {} as TestStepResult,
            },
          })
        }

        messages.push({
          testCaseFinished: {
            testCaseStartedId: testCaseStartedId,
            willBeRetried: false,
            timestamp: makeTimestamp(),
          },
        })
      })
    }
  })
}
