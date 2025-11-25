import { expect } from 'chai'

import { TestCaseContext } from './types.js'
import { wrapTransformer } from './wrapTransformer.js'

describe('wrapTransformer', () => {
  it('returns undefined when transformer is undefined', () => {
    const result = wrapTransformer(undefined)

    expect(result).to.eq(undefined)
  })

  it('prepends context to args and uses world as this', () => {
    const transformer = function (
      this: any, // eslint-disable-line @typescript-eslint/no-explicit-any
      context: TestCaseContext,
      match1: string,
      match2: string
    ) {
      return {
        fromThis: this.foo,
        fromContext: context.world.foo,
        match1,
        match2,
      }
    }

    const wrapped = wrapTransformer(transformer)!
    const testContext = { world: { foo: 'bar' } } as TestCaseContext
    const result = wrapped.call(testContext, 'a', 'b')

    expect(result).to.deep.eq({
      fromThis: 'bar',
      fromContext: 'bar',
      match1: 'a',
      match2: 'b',
    })
  })
})
