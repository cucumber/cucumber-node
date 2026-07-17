import { Query } from '@cucumber/query'
import { expect } from 'chai'

import { makeTestHarness } from '../utils.js'

describe('Attachments', () => {
  it('captures attachments against the correct test case and test step', async () => {
    const harness = await makeTestHarness()
    await harness.writeFile(
      'features/foo.feature',
      `Feature: a feature
  Scenario: a scenario
    Given a noop step
    And a step that attaches JSON
    And a step that attaches a log
    And a step that attaches a link
    `
    )
    await harness.writeFile(
      'features/steps.js',
      `import { Given } from '@cucumber/node'
  Given('a noop step', () => {})
  Given('a step that attaches JSON', async (t) => {
    await t.attach('{"foo":"bar"}', { mediaType: 'application/json' })
  })
  Given('a step that attaches a log', async (t) => {
    await t.log('Hello world')
  })
  Given('a step that attaches a link', async (t) => {
    await t.link('https://cucumber.io')
  })
    `
    )
    const query = new Query()
    await harness.run(query)
    const [testCaseStarted] = query.findAllTestCaseStarted()
    const [noopStep, attachStep, logStep, linkStep] = query.findTestStepsFinishedBy(testCaseStarted)
    expect(query.findAttachmentsBy(noopStep).map((a) => a.body)).to.deep.equal([])
    expect(query.findAttachmentsBy(attachStep).map((a) => a.body)).to.deep.equal(['{"foo":"bar"}'])
    expect(query.findAttachmentsBy(logStep).map((a) => a.body)).to.deep.equal(['Hello world'])
    expect(query.findAttachmentsBy(linkStep).map((a) => a.body)).to.deep.equal([
      'https://cucumber.io',
    ])
  })
})
