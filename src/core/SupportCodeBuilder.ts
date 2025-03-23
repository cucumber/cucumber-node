import {
  CucumberExpression,
  ParameterType,
  ParameterTypeRegistry,
} from '@cucumber/cucumber-expressions'
import { SourceReference } from '@cucumber/messages'
import parse from '@cucumber/tag-expressions'

import {
  DefinedHook,
  DefinedParameterType,
  DefinedStep,
  SupportCodeLibrary,
  UndefinedParameterType,
} from './SupportCodeLibrary.js'
import { SupportCodeFunction } from './types.js'

interface RegisteredParameterType {
  id: string
  name: string
  regexp: RegExp | string | readonly RegExp[] | readonly string[]
  transformer?: (...match: string[]) => unknown
  useForSnippets?: boolean
  preferForRegexpMatch?: boolean
  sourceReference: SourceReference
}

interface RegisteredHook {
  id: string
  name?: string
  tagFilter?: string
  fn: SupportCodeFunction
  sourceReference: SourceReference
}

interface RegisteredStep {
  id: string
  text: string
  fn: SupportCodeFunction
  sourceReference: SourceReference
}

export class SupportCodeBuilder {
  private readonly parameterTypeRegistry = new ParameterTypeRegistry()
  private readonly undefinedParameterTypes: Map<string, Set<string>> = new Map()
  private readonly parameterTypes: Array<RegisteredParameterType> = []
  private readonly steps: Array<RegisteredStep> = []
  private readonly beforeHooks: Array<RegisteredHook> = []
  private readonly afterHooks: Array<RegisteredHook> = []

  constructor(private readonly newId: () => string) {}

  registerParameterType(options: Omit<RegisteredParameterType, 'id'>): SupportCodeBuilder {
    this.parameterTypes.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  registerBeforeHook(options: Omit<RegisteredHook, 'id'>): SupportCodeBuilder {
    this.beforeHooks.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  registerAfterHook(options: Omit<RegisteredHook, 'id'>): SupportCodeBuilder {
    this.afterHooks.push({
      id: this.newId(),
      ...options,
    })
    return this
  }

  registerStep(
    text: string,
    fn: SupportCodeFunction,
    sourceReference: SourceReference
  ): SupportCodeBuilder {
    this.steps.push({
      id: this.newId(),
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

  toLibrary(): SupportCodeLibrary {
    return new SupportCodeLibrary(
      this.buildParameterTypes(),
      this.buildSteps(),
      this.buildUndefinedParameterTypes(),
      this.buildBeforeHooks(),
      this.buildAfterHooks()
    )
  }
}
