import path from 'node:path'

import { Location } from '@cucumber/messages'
import { expect } from 'chai'

import { mapLocation } from './mapLocation.js'

describe('mapSourceLocation', () => {
  const uri = path.join('features', 'example.feature')

  it('maps location with both line and column', () => {
    const location: Location = { line: 10, column: 5 }
    const result = mapLocation(uri, location)

    expect(result).to.deep.eq({
      start: { line: 10, column: 4, index: 0 },
      end: { line: 10, column: 4, index: 0 },
      filename: 'example.feature',
      identifierName: undefined,
    })
  })

  it('maps location with line but missing column', () => {
    const location: Location = { line: 15 }
    const result = mapLocation(uri, location)

    expect(result).to.deep.eq({
      start: { line: 15, column: 0, index: 0 },
      end: { line: 15, column: 0, index: 0 },
      filename: 'example.feature',
      identifierName: undefined,
    })
  })

  it('maps with default position when location is missing', () => {
    const result = mapLocation(uri)

    expect(result).to.deep.eq({
      start: { line: 1, column: 0, index: 0 },
      end: { line: 1, column: 0, index: 0 },
      filename: 'example.feature',
      identifierName: undefined,
    })
  })
})
