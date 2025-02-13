import { expect } from 'chai'

import { DataTable } from './DataTable.js'

describe('DataTable', () => {
  it('should return a copy of the raw cells', () => {
    const cells = [
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]
    const dataTable = new DataTable(cells)
    expect(dataTable.raw()).to.deep.eq(cells)
    expect(dataTable.raw()).to.not.eq(cells)
  })

  it('should produce an array of rows as objects, with keys from the first row', () => {
    expect(
      new DataTable([
        ['a', 'b', 'c'],
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
      ]).hashes()
    ).to.deep.eq([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
      { a: '7', b: '8', c: '9' },
    ])
  })

  it('should produce a list for a single column', () => {
    expect(new DataTable([['foo'], ['bar'], ['baz']]).list()).to.deep.eq(['foo', 'bar', 'baz'])
  })

  it('should transpose', () => {
    expect(
      new DataTable([
        ['a', 'b', 'c'],
        ['1', '2', '3'],
      ])
        .transpose()
        .raw()
    ).to.deep.eq([
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
    ])
  })
})
