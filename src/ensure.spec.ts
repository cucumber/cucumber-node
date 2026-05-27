import { expect } from 'chai'

import { ensure } from './ensure.js'

describe('ensure', () => {
  it('returns the value when it is truthy', () => {
    const result = ensure('foo', 'should not throw')

    expect(result).to.eq('foo')
  })

  it('throws with the given message when the value is undefined', () => {
    expect(() => ensure(undefined, 'value was missing')).to.throw('value was missing')
  })
})
