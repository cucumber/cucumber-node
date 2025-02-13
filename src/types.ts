import { Readable } from 'node:stream'

import { Promisable } from 'type-fest'

/**
 * Options for {@link TestCaseContext.attach}
 * @public
 */
export type AttachmentOptions = {
  /**
   * MIME type of the content you are attaching
   * @example application/json
   * @example image/jpeg
   * @example text/plain
   */
  mediaType: string
  /**
   * Optional filename for the content that should be used if it is later saved/exported
   * @example screenshot.png
   */
  fileName?: string
}

/**
 * A context object injected into every test step function as the first argument.
 * @public
 */
export type TestCaseContext = {
  /**
   * Mark this test step as skipped. This will cause all subsequent steps to be skipped,
   * except `After` hooks.
   * @remarks
   * Results in a Cucumber status of "skipped" for the scenario.
   */
  skip(): void
  /**
   * Mark this test step as pending. This will cause all subsequent steps to be skipped,
   * except `After` hooks.
   * @remarks
   * Results in a Cucumber status of "pending" for the scenario.
   */
  todo(): void
  /**
   * Capture an attachment of some content that should be associated with this test step,
   * and might be accessed later in a report.
   * @param data - the content to attach, as a stream, buffer or just a plain string
   * @param options - declare more information about this attachment
   */
  attach(data: Readable | Buffer | string, options: AttachmentOptions): Promise<void>
  /**
   * Capture a "log" attachment.
   * @param text - the text to be logged
   * @remarks
   * A shorthand for {@link TestCaseContext.attach} with a special media type.
   */
  log(text: string): Promise<void>
  /**
   * Capture a URL attachment.
   * @param url - the URL to be captured
   * @param title - the text title that should accompany the URL
   * @remarks
   * A shorthand for {@link TestCaseContext.attach} with a special media type.
   */
  link(url: string, title?: string): Promise<void>
  /**
   * An object scoped only to this test case, that can be used to share state between
   * test steps.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  world: any
}

/**
 * Options for defining a custom parameter type.
 * @public
 */
export type ParameterTypeOptions = {
  /**
   * The name of the parameter type.
   */
  name: string
  /**
   * One or more regular expressions which should be used to match the parameter type.
   */
  regexp: RegExp | string | readonly RegExp[] | readonly string[]
  /**
   * A function for transforming the matched values to another object before passing to
   * the step function.
   * @param match - matched values from the regular expression
   * @remarks
   * If not provided, the raw matched value(s) will be passed to the step function.
   */
  transformer?: (...match: string[]) => unknown
  /**
   * Whether this parameter type should be used when suggesting snippets for missing step
   * definitions.
   * @default true
   */
  useForSnippets?: boolean
  /**
   * Whether the regular expression(s) for this parameter type should take precedence if used
   * in conjunction with regular expressions for step definitions.
   * @default false
   */
  preferForRegexpMatch?: boolean
}

/**
 * Options for defining hooks.
 * @public
 */
export type HookOptions = {
  /**
   * Optional name for this hook which might be surfaced in reports.
   */
  name?: string
  /**
   * Optional tag expression which, if not a match for a given scenario, will cause this hook
   * to be omitted from the test.
   */
  tagFilter?: string
}

/**
 * A function to be executed as a hook.
 * @public
 * @remarks
 * Can optionally return a promise, which will duly be awaited. The actual returned/resolved value
 * is not read.
 */
export type HookFunction = (context: TestCaseContext) => Promisable<void>

/**
 * A function to be executed as a step.
 * @public
 * @remarks
 * Can optionally return a promise, which will duly be awaited. The actual returned/resolved value
 * is not read.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StepFunction = (context: TestCaseContext, ...args: any) => Promisable<void>
