import { NewParameterType } from '@cucumber/core'

import { TestCaseContext, TransformerFunction } from './types.js'

/*
 * Turn the user-supplied transformer function into one we can provide to
 * the ParameterTypeRegistry - which only supports a custom `this` for
 * modifying behaviour - while maintaining our signature of prepending
 * the context as the first arg, and setting the world as `this` for
 * continuity when coming from cucumber-js
 */
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
