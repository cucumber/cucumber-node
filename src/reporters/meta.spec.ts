import { expect } from 'chai'

import { meta } from './meta.js'

describe('meta', () => {
  it('lists the correct name', () => {
    expect(meta.implementation.name).to.eq('cucumber-node')
  })

  it('lists the version', () => {
    expect(meta.implementation.version).to.match(/\d+\.\d+\.\d+/)
  })
})
