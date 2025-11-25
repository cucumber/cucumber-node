import { NewParameterType } from '@cucumber/core'

import { TestCaseContext, TransformerFunction } from './types.js'

export function wrapTransformer(
  transformer?: TransformerFunction
): NewParameterType['transformer'] {
  if (transformer) {
    return function (this: TestCaseContext, ...match: string[]) {
      return transformer.apply(this.world, [this, ...match])
    }
  }
  return undefined
}
