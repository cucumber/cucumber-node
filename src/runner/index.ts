import { suite, test } from 'node:test'

import { makeTestPlan } from '@cucumber/core'

import { newId } from '../newId.js'
import { ExecutableTestPlan } from './ExecutableTestPlan.js'
import { loadSupport } from './loadSupport.js'
import { messages } from './state.js'
import { CompiledGherkin } from './types.js'

export * from './types.js'

export async function run(gherkin: CompiledGherkin) {
  const plan = await prepare(gherkin)
  await suite(plan.name, async () => {
    for (const pickle of gherkin.pickles) {
      const testCase = plan.select(pickle.id)
      await test(testCase.name, async (ctx1) => {
        await testCase.setup(ctx1)
        for (const testStep of testCase.testSteps) {
          await testStep.setup()
          await ctx1.test(testStep.name, testStep.options, async (ctx2) => {
            await testStep.execute(ctx2)
          })
          await testStep.teardown()
        }
        await testCase.teardown()
      })
    }
  })
}

export async function prepare({ source, gherkinDocument, pickles }: CompiledGherkin) {
  messages.push({ source })
  messages.push({ gherkinDocument })
  messages.push(...pickles.map((pickle) => ({ pickle })))

  const { supportCodeLibrary, worldFactory } = await loadSupport()
  messages.push(...supportCodeLibrary.toEnvelopes())

  const plan = makeTestPlan({ gherkinDocument, pickles, supportCodeLibrary }, { newId: newId })
  messages.push(...plan.toEnvelopes())

  return new ExecutableTestPlan(worldFactory, plan)
}
