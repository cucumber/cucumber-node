import { Promisable } from 'type-fest'

import { makeSourceReference } from './makeSourceReference.js'
import { coreBuilder, extraBuilder } from './runner/state.js'
import { HookFunction, HookOptions, ParameterTypeOptions, StepFunction, World } from './types.js'
import { wrapTransformer } from './wrapTransformer.js'

export * from './types.js'
export { DataTable } from '@cucumber/core'

/**
 * Define a custom world creator and (optional) destroyer. These will be use to create and
 * destroy each World instance. Both functions can either return a value, or promise that resolves
 * to a value.
 * @public
 * @param creator - A function that creates and returns a custom World object
 * @param destroyer - An optional function to clean up the World object after each test case
 * @example CustomWorld(async () => \{
 *   return \{ myCustomProperty: 'value' \}
 * \}, async (world) => \{
 *   // cleanup resources
 * \})
 */
export function WorldCreator(
  creator: () => Promisable<World>,
  destroyer?: (world: World) => Promisable<void>
) {
  extraBuilder.worldCreator(creator)
  if (destroyer) {
    extraBuilder.worldDestroyer(destroyer)
  }
}

/**
 * Define a custom parameter type for use in steps.
 * @public
 * @param options - define the behaviour of this parameter type
 * @example ParameterType(\{
 *   name: 'flight',
 *   regexp: /([A-Z]\{3\})-([A-Z]\{3\})/,
 *   transformer(t, from, to) \{
 *     return new Flight(from, to)
 *   \},
 * \})
 */
export function ParameterType(options: ParameterTypeOptions) {
  coreBuilder.parameterType({
    ...options,
    transformer: wrapTransformer(options.transformer),
    sourceReference: makeSourceReference(),
  })
}

/**
 * Define a hook that should be executed before Gherkin-derived steps in each test.
 * @public
 * @param fn - the function to be executed
 * @example Before(async () => \{
 *   // do stuff here
 * \})
 */
export function Before(fn: HookFunction): void
/**
 * Define a hook that should be executed before Gherkin-derived steps in each test.
 * @public
 * @param options - declare more information about this hook
 * @param fn - the function to be executed
 * @example Before(\{ name: 'Provision resources', tagFilter: '\@uses-resources' \}, async () => \{
 *   // do stuff here
 * \})
 */
export function Before(options: HookOptions, fn: HookFunction): void
export function Before(arg1: HookFunction | HookOptions, arg2?: HookFunction) {
  const options = typeof arg1 === 'object' ? arg1 : {}
  const fn = arg2 ?? (arg1 as HookFunction)
  coreBuilder.beforeHook({
    ...options,
    fn,
    sourceReference: makeSourceReference(),
  })
}

/**
 * Define a hook that should be executed after Gherkin-derived steps in each test.
 * @public
 * @param fn - the function to be executed
 * @example After(async () => \{
 *   // do stuff here
 * \})
 */
export function After(fn: HookFunction): void
/**
 * Define a hook that should be executed after Gherkin-derived steps in each test.
 * @public
 * @param options - declare more information about this hook
 * @param fn - the function to be executed
 * @example After(\{ name: 'Teardown resources', tagFilter: '\@uses-resources' \}, async () => \{
 *   // do stuff here
 * \})
 */
export function After(options: HookOptions, fn: HookFunction): void
export function After(arg1: HookFunction | HookOptions, arg2?: HookFunction) {
  const options = typeof arg1 === 'object' ? arg1 : {}
  const fn = arg2 ?? (arg1 as HookFunction)
  coreBuilder.afterHook({
    ...options,
    fn,
    sourceReference: makeSourceReference(),
  })
}

/**
 * Define a step to be used with the "Given" keyword
 * @public
 * @param pattern - a Cucumber Expression or regular expression used to match the step with steps from Gherkin
 * @param fn - the function to be executed
 * @example Given('I have \{int\} cukes in my belly', async (t, count) => \{
 *   // do stuff here
 * \})
 */
export function Given(pattern: string | RegExp, fn: StepFunction) {
  coreBuilder.step({ pattern, fn, sourceReference: makeSourceReference() })
}

/**
 * Define a step to be used with the "When" keyword
 * @public
 * @param pattern - a Cucumber Expression or regular expression used to match the step with steps from Gherkin
 * @param fn - the function to be executed
 * @example When('I have \{int\} cukes in my belly', async (t, count) => \{
 *   // do stuff here
 * \})
 */
export function When(pattern: string | RegExp, fn: StepFunction) {
  coreBuilder.step({ pattern, fn, sourceReference: makeSourceReference() })
}

/**
 * Define a step to be used with the "Then" keyword
 * @public
 * @param pattern - a Cucumber Expression or regular expression used to match the step with steps from Gherkin
 * @param fn - the function to be executed
 * @example Then('I have \{int\} cukes in my belly', async (t, count) => \{
 *   // do stuff here
 * \})
 */
export function Then(pattern: string | RegExp, fn: StepFunction) {
  coreBuilder.step({ pattern, fn, sourceReference: makeSourceReference() })
}
