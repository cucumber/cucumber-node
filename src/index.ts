import { makeSourceReference } from './makeSourceReference.js'
import { builder } from './runner/state.js'
import { HookFunction, HookOptions, ParameterTypeOptions, StepFunction } from './types.js'

export * from './DataTable.js'
export * from './types.js'

/**
 * Define a custom parameter type for use in steps.
 * @public
 * @param options - define the behaviour of this parameter type
 * @example ParameterType(\{
 *   name: 'flight',
 *   regexp: /([A-Z]\{3\})-([A-Z]\{3\})/,
 *   transformer(from, to) \{
 *     return new Flight(from, to)
 *   \},
 * \})
 */
export function ParameterType(options: ParameterTypeOptions) {
  builder.registerParameterType(options, makeSourceReference())
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
  builder.registerBeforeHook(options, fn, makeSourceReference())
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
  builder.registerAfterHook(options, fn, makeSourceReference())
}

/**
 * Define a step to be used with the "Given" keyword
 * @public
 * @param text - a Cucumber Expression used to match the step with steps from Gherkin
 * @param fn - the function to be executed
 * @example Given('I have \{int\} cukes in my belly', async (t, count) => \{
 *   // do stuff here
 * \})
 */
export function Given(text: string, fn: StepFunction) {
  builder.registerStep(text, fn, makeSourceReference())
}

/**
 * Define a step to be used with the "When" keyword
 * @public
 * @param text - a Cucumber Expression used to match the step with steps from Gherkin
 * @param fn - the function to be executed
 * @example When('I have \{int\} cukes in my belly', async (t, count) => \{
 *   // do stuff here
 * \})
 */
export function When(text: string, fn: StepFunction) {
  builder.registerStep(text, fn, makeSourceReference())
}

/**
 * Define a step to be used with the "Then" keyword
 * @public
 * @param text - a Cucumber Expression used to match the step with steps from Gherkin
 * @param fn - the function to be executed
 * @example Then('I have \{int\} cukes in my belly', async (t, count) => \{
 *   // do stuff here
 * \})
 */
export function Then(text: string, fn: StepFunction) {
  builder.registerStep(text, fn, makeSourceReference())
}
