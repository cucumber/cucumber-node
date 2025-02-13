import {
  CucumberExpression,
  ParameterType,
  ParameterTypeRegistry,
} from '@cucumber/cucumber-expressions'
import { SourceReference } from '@cucumber/messages'
import parse from '@cucumber/tag-expressions'

import { makeId } from '../makeId.js'
import { HookFunction, HookOptions, ParameterTypeOptions, StepFunction } from '../types.js'
import {
  DefinedHook,
  DefinedParameterType,
  DefinedStep,
  SupportCodeLibrary,
  UndefinedParameterType,
} from './SupportCodeLibrary.js'

interface RegisteredParameterType extends ParameterTypeOptions {
  id: string
  sourceReference: SourceReference
}

interface RegisteredHook extends HookOptions {
  id: string
  fn: HookFunction
  sourceReference: SourceReference
}

interface RegisteredStep {
  id: string
  text: string
  fn: StepFunction
  sourceReference: SourceReference
}

export class SupportCodeBuilder {
  private readonly parameterTypeRegistry = new ParameterTypeRegistry()
  private readonly undefinedParameterTypes: Map<string, Set<string>> = new Map()
  private readonly parameterTypes: Array<RegisteredParameterType> = []
  private readonly steps: Array<RegisteredStep> = []
  private readonly beforeHooks: Array<RegisteredHook> = []
  private readonly afterHooks: Array<RegisteredHook> = []

  registerParameterType(
    options: ParameterTypeOptions,
    sourceReference: SourceReference
  ): SupportCodeBuilder {
    this.parameterTypes.push({
      id: makeId(),
      ...options,
      sourceReference,
    })
    return this
  }

  registerBeforeHook(
    options: HookOptions,
    fn: HookFunction,
    sourceReference: SourceReference
  ): SupportCodeBuilder {
    this.beforeHooks.push({
      id: makeId(),
      ...options,
      fn,
      sourceReference,
    })
    return this
  }

  registerAfterHook(
    options: HookOptions,
    fn: HookFunction,
    sourceReference: SourceReference
  ): SupportCodeBuilder {
    this.afterHooks.push({
      id: makeId(),
      ...options,
      fn,
      sourceReference,
    })
    return this
  }

  registerStep(
    text: string,
    fn: StepFunction,
    sourceReference: SourceReference
  ): SupportCodeBuilder {
    this.steps.push({
      id: makeId(),
      text,
      fn,
      sourceReference,
    })
    return this
  }

  private buildParameterTypes(): ReadonlyArray<DefinedParameterType> {
    return this.parameterTypes.map((registered) => {
      const parameterType = new ParameterType(
        registered.name,
        registered.regexp,
        null,
        registered.transformer,
        registered.useForSnippets ?? true,
        registered.preferForRegexpMatch ?? false
      )
      this.parameterTypeRegistry.defineParameterType(parameterType)
      return {
        id: registered.id,
        name: registered.name,
        regularExpressions: [...parameterType.regexpStrings],
        preferForRegularExpressionMatch: parameterType.preferForRegexpMatch as boolean,
        useForSnippets: parameterType.useForSnippets as boolean,
        sourceReference: registered.sourceReference,
      }
    })
  }

  private buildSteps(): ReadonlyArray<DefinedStep> {
    return this.steps
      .map(({ id, text, fn, sourceReference }) => {
        const expression = this.compileExpression(text)
        if (!expression) {
          return undefined
        }
        return {
          id,
          rawExpression: text,
          expression,
          fn,
          sourceReference,
        }
      })
      .filter((step) => !!step)
  }

  private compileExpression(text: string): CucumberExpression | undefined {
    try {
      return new CucumberExpression(text, this.parameterTypeRegistry)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if ('undefinedParameterTypeName' in e) {
        if (!this.undefinedParameterTypes.has(e.undefinedParameterTypeName)) {
          this.undefinedParameterTypes.set(e.undefinedParameterTypeName, new Set())
        }
        this.undefinedParameterTypes.get(e.undefinedParameterTypeName)?.add(text)
        return undefined
      } else {
        throw e
      }
    }
  }

  private buildUndefinedParameterTypes(): ReadonlyArray<UndefinedParameterType> {
    return [...this.undefinedParameterTypes.entries()]
      .map(([name, expressions]) => {
        return [...expressions].map((expression) => ({ name, expression }))
      })
      .flat()
  }

  private buildBeforeHooks(): ReadonlyArray<DefinedHook> {
    return this.beforeHooks.map(({ id, name, tagFilter, fn, sourceReference }) => {
      return {
        id,
        name,
        rawTagExpression: tagFilter,
        tagExpression: tagFilter ? parse(tagFilter) : undefined,
        fn,
        sourceReference,
      }
    })
  }

  private buildAfterHooks(): ReadonlyArray<DefinedHook> {
    return this.afterHooks.map(({ id, name, tagFilter, fn, sourceReference }) => {
      return {
        id,
        name,
        rawTagExpression: tagFilter,
        tagExpression: tagFilter ? parse(tagFilter) : undefined,
        fn,
        sourceReference,
      }
    })
  }

  build(): SupportCodeLibrary {
    return new SupportCodeLibrary(
      this.buildParameterTypes(),
      this.buildSteps(),
      this.buildUndefinedParameterTypes(),
      this.buildBeforeHooks(),
      this.buildAfterHooks()
    )
  }
}
