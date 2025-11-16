import { makeTestPlan } from '@cucumber/core'

import { newId } from '../newId.js'
import { ExecutableTestPlan } from './ExecutableTestPlan.js'
import { loadSupport } from './loadSupport.js'
import { messages } from './state.js'
import { CompiledGherkin } from './types.js'

export * from './types.js'

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
