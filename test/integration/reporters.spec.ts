import { stripVTControlCharacters } from 'node:util'
import { expect } from 'chai'
import { makeTestHarness } from '../utils.js'
import path from 'node:path'

describe('Reporters', () => {
  describe('spec', () => {
    it('does not emit messages as diagnostics if no cucumber reporters', async () => {
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
        `import { Given } from '@cucumber/node'
  Given('a step', () => {})
    `
      )
      const [output] = await harness.run('spec')
      const sanitised = stripVTControlCharacters(output.trim())
      expect(sanitised).not.to.include('@cucumber/messages:')
    })

    it('provides a useful error for an ambiguous step', async () => {
      const harness = await makeTestHarness()
      await harness.writeFile(
        'features/first.feature',
        `Feature:
  Scenario:
    Given a step`
      )
      await harness.writeFile(
        'features/steps.js',
        `import { Given } from '@cucumber/node'
Given('a step', () => {})
Given('a step', () => {})`
      )
      const [output] = await harness.run('spec')
      const sanitised = stripVTControlCharacters(output.trim())
      expect(sanitised).to.include(`Multiple matching step definitions found for text "a step":
  1) ${path.join('features', 'steps.js')}:2:1
  2) ${path.join('features', 'steps.js')}:3:1`)
    })

    it('provides a useful error for an undefined step', async () => {
      const harness = await makeTestHarness()
      await harness.writeFile(
        'features/first.feature',
        `Feature:
  Scenario:
    Given a step
    `
      )
      const [output] = await harness.run('spec')
      const sanitised = stripVTControlCharacters(output.trim())
      expect(sanitised).to.include('No matching step definitions found for text "a step"')
    })
  })

  describe('junit', () => {
    it('outputs a junit xml report', async () => {
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
        `import { Given } from '@cucumber/node'
  Given('a step', () => {})
    `
      )

      const [output] = await harness.run('@cucumber/node/reporters/junit')

      expect(output).to.include(
        '<system-out><![CDATA[Given a step................................................................passed]]></system-out>'
      )
    })
  })
})
