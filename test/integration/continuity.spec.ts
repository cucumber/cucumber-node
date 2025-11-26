import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'
import { Query } from '@cucumber/query'

describe('Continuity for cucumber-js users', () => {
  it('skips when the user code function returns "skipped"', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/first.feature',
      `Feature:
Scenario:
  Given a step
  And another step
  `
    )
    await harness.writeFile(
      'features/steps.js',
      `import { Given } from '@cucumber/node'
Given('a step', () => {
  return 'skipped'
})
Given('another step', (t) => {
  // no-op
})
  `
    )
    const [output] = await harness.run('spec')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ skipped 2')
  })

  it('marks as todo when the user code function returns "pending"', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/first.feature',
      `Feature:
Scenario:
  Given a step
  And another step
  `
    )
    await harness.writeFile(
      'features/steps.js',
      `import { Given } from '@cucumber/node'
Given('a step', () => {
  return 'pending'
})
Given('another step', (t) => {
  // no-op
})
  `
    )
    const [output] = await harness.run('spec')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ todo 1')
    expect(sanitised).to.include('ℹ skipped 1')
  })

  it('uses the world as `this` for user code functions', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/first.feature',
      `Feature:
Scenario:
  Given a step
  `
    )
    await harness.writeFile(
      'features/steps.js',
      `import assert from 'node:assert'
import { After, Before, Given, ParameterType } from '@cucumber/node'
Before(function(t) {
  assert.strictEqual(this, t.world)
  this.foo = 'bar'
})
ParameterType({
  name: 'thing',
  regexp: /[a-z]+/,
  transformer(thing) {
    assert.strictEqual(this.foo, 'bar')
    return thing
  },
})
Given('a {thing}', function(thing) {
  assert.strictEqual(this.foo, 'bar')
})
After(function() {
  assert.strictEqual(this.foo, 'bar')
})
  `
    )
    const [output] = await harness.run('spec')
    const sanitised = stripVTControlCharacters(output.trim())
    expect(sanitised).to.include('ℹ pass 4')
  })

  it('supplies attachment functions to the world', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/foo.feature',
      `Feature: a feature
  Scenario: a scenario
    Given a noop step
    And a step that attaches
    `
    )
    await harness.writeFile(
      'features/steps.js',
      `import { Given } from '@cucumber/node'
  Given('a noop step', () => {})
  Given('a step that attaches', async function() {
    await this.attach('{"foo":"bar"}', { mediaType: 'application/json' })
    await this.log('Hello world')
    await this.link('https://cucumber.io')
  })
    `
    )
    const query = new Query()
    await harness.run(query)
    const [testCaseStarted] = query.findAllTestCaseStarted()
    const [noopStep, attachStep] = query.findTestStepsFinishedBy(testCaseStarted)
    expect(query.findAttachmentsBy(noopStep).map((a) => a.body)).to.deep.equal([])
    expect(query.findAttachmentsBy(attachStep).map((a) => a.body)).to.deep.equal([
      '{"foo":"bar"}',
      'Hello world',
      'https://cucumber.io',
    ])
  })
})
