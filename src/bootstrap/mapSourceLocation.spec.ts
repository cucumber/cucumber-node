import path from 'node:path'

import { Location, Pickle } from '@cucumber/messages'
import { expect } from 'chai'

import { mapSourceLocation } from './mapSourceLocation.js'

describe('mapSourceLocation', () => {
  const pickle = { uri: path.join('features', 'example.feature') } as Pickle

  it('maps location with both line and column', () => {
    const location: Location = { line: 10, column: 5 }
    const result = mapSourceLocation(pickle, location)

    expect(result).to.deep.eq({
      start: { line: 10, column: 4, index: 0 },
      end: { line: 10, column: 4, index: 0 },
      filename: 'example.feature',
      identifierName: undefined,
    })
  })

  it('maps location with line but missing column', () => {
    const location: Location = { line: 15 }
    const result = mapSourceLocation(pickle, location)

    expect(result).to.deep.eq({
      start: { line: 15, column: 0, index: 0 },
      end: { line: 15, column: 0, index: 0 },
      filename: 'example.feature',
      identifierName: undefined,
    })
  })

  it('maps with default position when location is missing', () => {
    const result = mapSourceLocation(pickle)

    expect(result).to.deep.eq({
      start: { line: 1, column: 0, index: 0 },
      end: { line: 1, column: 0, index: 0 },
      filename: 'example.feature',
      identifierName: undefined,
    })
  })
})
