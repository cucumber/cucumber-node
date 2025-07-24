import { suite, test } from 'node:test'
import { styleText } from 'node:util'

import { makeTestPlan } from '@cucumber/core'
import { GherkinDocument, Pickle, Source, TestStepResult } from '@cucumber/messages'

import { makeTimestamp } from '../makeTimestamp.js'
import { newId } from '../newId.js'
import { ContextTracker } from './ContextTracker.js'
import { loadSupport } from './loadSupport.js'
import { messages } from './state.js'

interface CompiledGherkin {
  source: Source
  gherkinDocument: GherkinDocument
  pickles: ReadonlyArray<Pickle>
}

export async function run({ source, gherkinDocument, pickles }: CompiledGherkin) {
  messages.push({ source })
  messages.push({ gherkinDocument })
  messages.push(...pickles.map((pickle) => ({ pickle })))

  const { supportCodeLibrary, worldFactory } = await loadSupport()
  messages.push(...supportCodeLibrary.toEnvelopes())

  const plan = makeTestPlan({ gherkinDocument, pickles, supportCodeLibrary }, { newId: newId })
  messages.push(...plan.toEnvelopes())

  await suite(plan.name, async () => {
    for (const testCase of plan.testCases) {
      const testCaseStartedId = newId()

      await test(testCase.name, async (ctx1) => {
        messages.connect(ctx1)
        messages.push({
          testCaseStarted: {
            id: testCaseStartedId,
            testCaseId: testCase.id,
            attempt: 0,
            timestamp: makeTimestamp(),
          },
        })

        const world = await worldFactory.create()
        const tracker = new ContextTracker(testCaseStartedId, world, (e) => messages.push(e))

        for (const step of testCase.steps) {
          messages.push({
            testStepStarted: {
              testCaseStartedId: testCaseStartedId,
              testStepId: step.id,
              timestamp: makeTimestamp(),
            },
          })

          await ctx1.test(
            [styleText('bold', step.name.prefix), step.name.body].filter(Boolean).join(' '),
            { skip: tracker.outcomeKnown && !step.always },
            async (ctx2) => {
              let success = false
              try {
                const { fn, args } = step.prepare(world)
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

        await worldFactory.destroy(world)

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
