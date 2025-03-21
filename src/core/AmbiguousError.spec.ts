import { SourceReference } from '@cucumber/messages'
import { expect } from 'chai'

import { AmbiguousError } from './AmbiguousError.js'

describe('AmbiguousError', () => {
  it('handles source references with and without locations', () => {
    const references: ReadonlyArray<SourceReference> = [
      { uri: 'steps.js', location: { line: 1, column: 2 } },
      { uri: 'steps.js', location: { line: 3, column: 4 } },
      { uri: 'mysterious.js' },
    ]
    const error = new AmbiguousError('text', references)
    expect(error.message).to.equal(
      'Multiple matching step definitions found for text "text":\n' +
        '1) steps.js:1:2\n' +
        '2) steps.js:3:4\n' +
        '3) mysterious.js:?:?'
    )
  })
})
