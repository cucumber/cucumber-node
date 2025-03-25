import { expect } from 'chai'

import { SupportCodeBuilder } from './SupportCodeBuilder.js'

describe('SupportCodeBuilder', () => {
  it('catches undefined parameter type errors and emits an appropriate message', () => {
    const builder = new SupportCodeBuilder(() => crypto.randomUUID())
    builder.registerStep('a {thing} happens', () => {}, {})

    const library = builder.toLibrary()

    expect(library.toEnvelopes().find((envelope) => envelope.undefinedParameterType)).to.deep.eq({
      undefinedParameterType: {
        expression: 'a {thing} happens',
        name: 'thing',
      },
    })
  })

  it('allows other errors from expression compilation to bubble', () => {
    const builder = new SupportCodeBuilder(() => crypto.randomUUID())
    // @ts-expect-error passing incorrect type to yield an error
    builder.registerStep(null, () => {}, {})

    expect(() => builder.toLibrary()).to.throw()
  })
})
