import { Argument, CucumberExpression } from '@cucumber/cucumber-expressions'
import { Envelope, HookType, SourceReference, StepDefinitionPatternType } from '@cucumber/messages'
import parse from '@cucumber/tag-expressions'

import { SupportCodeFunction } from './types.js'

export type UndefinedParameterType = {
  name: string
  expression: string
}

export type DefinedParameterType = {
  id: string
  name: string
  regularExpressions: ReadonlyArray<string>
  preferForRegularExpressionMatch: boolean
  useForSnippets: boolean
  sourceReference: SourceReference
}

export type DefinedHook = {
  id: string
  name?: string
  rawTagExpression?: string
  tagExpression?: ReturnType<typeof parse>
  fn: SupportCodeFunction
  sourceReference: SourceReference
}

export type DefinedStep = {
  id: string
  rawExpression: string
  expression: CucumberExpression
  fn: SupportCodeFunction
  sourceReference: SourceReference
}

export type MatchedStep = {
  def: DefinedStep
  args: ReadonlyArray<Argument>
}

export class SupportCodeLibrary {
  constructor(
    private readonly parameterTypes: ReadonlyArray<DefinedParameterType> = [],
    private readonly steps: ReadonlyArray<DefinedStep> = [],
    private readonly undefinedParameterTypes: ReadonlyArray<UndefinedParameterType> = [],
    private readonly beforeHooks: ReadonlyArray<DefinedHook> = [],
    private readonly afterHooks: ReadonlyArray<DefinedHook> = []
  ) {}

  findAllStepsBy(text: string): ReadonlyArray<MatchedStep> {
    const results: Array<MatchedStep> = []
    for (const def of this.steps) {
      const args = def.expression.match(text)
      if (args) {
        results.push({
          def,
          args,
        })
      }
    }
    return results
  }

  findAllBeforeHooksBy(tags: ReadonlyArray<string>): ReadonlyArray<DefinedHook> {
    return this.beforeHooks.filter((def) => {
      if (def.tagExpression) {
        return def.tagExpression.evaluate(tags as string[])
      }
      return true
    })
  }

  findAllAfterHooksBy(tags: ReadonlyArray<string>): ReadonlyArray<DefinedHook> {
    return this.afterHooks.filter((def) => {
      if (def.tagExpression) {
        return def.tagExpression.evaluate(tags as string[])
      }
      return true
    })
  }

  toEnvelopes(): ReadonlyArray<Envelope> {
    return [
      ...this.parameterTypes.map((parameterType) => ({ parameterType })),
      ...this.steps.map(({ id, rawExpression, sourceReference }) => {
        return {
          stepDefinition: {
            id,
            pattern: {
              type: StepDefinitionPatternType.CUCUMBER_EXPRESSION,
              source: rawExpression,
            },
            sourceReference,
          },
        }
      }),
      ...this.undefinedParameterTypes.map((undefinedParameterType) => ({ undefinedParameterType })),
      ...this.beforeHooks.map(({ id, name, rawTagExpression, sourceReference }) => {
        return {
          hook: {
            id,
            type: HookType.BEFORE_TEST_CASE,
            name,
            tagExpression: rawTagExpression,
            sourceReference,
          },
        }
      }),
      ...this.afterHooks.map(({ id, name, rawTagExpression, sourceReference }) => {
        return {
          hook: {
            id,
            type: HookType.AFTER_TEST_CASE,
            name,
            tagExpression: rawTagExpression,
            sourceReference,
          },
        }
      }),
    ]
  }
}
