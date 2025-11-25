import { NewParameterType } from '@cucumber/core/dist/types.js'

import { ParameterTypeOptions, TestCaseContext } from './types.js'

export function wrapTransformer(transformer: ParameterTypeOptions['transformer']): NewParameterType['transformer'] {
  if (transformer) {
    return function(this: TestCaseContext, ...match: string[]) {
      return transformer.apply(this.world, [this, ...match])
    }
  }
  return undefined
}