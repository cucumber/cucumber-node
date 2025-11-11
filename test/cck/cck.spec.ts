import { describe, it } from 'mocha'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, use } from 'chai'
import chaiExclude from 'chai-exclude'
import { makeTestHarness } from '../utils.js'
import { Envelope } from '@cucumber/messages'
import { globby, globbySync } from 'globby'

use(chaiExclude)

const IGNORABLE_KEYS = [
  'meta',
  // sources
  'uri',
  'line',
  'column',
  // ids
  'astNodeId',
  'astNodeIds',
  'hookId',
  'id',
  'pickleId',
  'pickleStepId',
  'stepDefinitionIds',
  'testRunStartedId',
  'testCaseId',
  'testCaseStartedId',
  'testStepId',
  // time
  'nanos',
  'seconds',
  // errors
  'message',
  'stackTrace',
]

const CCK_PATH = path.join(process.cwd(), 'node_modules', '@cucumber', 'compatibility-kit')

const UNSUPPORTED = [
  // we don't support global hooks yet
  'global-hooks',
  'global-hooks-attachments',
  'global-hooks-beforeall-error',
  'global-hooks-afterall-error',
  // step definition messages emitted for every file
  'multiple-features',
  // we can't reverse order of all pickles
  'multiple-features-reversed',
  // node:test doesnt support retries yet
  'retry',
  'retry-ambiguous',
  'retry-pending',
  'retry-undefined',
]

describe('Cucumber Compatibility Kit', () => {
  const directories = globbySync('node_modules/@cucumber/compatibility-kit/features/*', {
    onlyDirectories: true,
  })
  for (const directory of directories) {
    const suite = path.basename(directory)

    it(suite, async function () {
      if (UNSUPPORTED.includes(suite)) {
        return this.skip()
      }

      const harness = await makeTestHarness()

      await harness.copyDir(path.join(process.cwd(), 'test', 'cck', suite), 'features')
      const featurePaths = await globby(['*.feature', '*.feature.md'], { cwd: directory })
      for (const featurePath of featurePaths) {
        await harness.copyFile(
          path.join(CCK_PATH, 'features', suite, featurePath),
          path.join('features', featurePath)
        )
      }

      const [actualOutput] = await harness.run('@cucumber/node/reporters/message')
      const expectedOutput = await readFile(path.join(directory, suite + '.ndjson'), {
        encoding: 'utf-8',
      })

      const actualEnvelopes = parseEnvelopes(actualOutput)
      const expectedEnvelopes = parseEnvelopes(expectedOutput)

      // first assert on the order and type of messages
      expect(actualEnvelopes.flatMap((envelope) => Object.keys(envelope))).to.deep.eq(
        expectedEnvelopes.flatMap((envelope) => Object.keys(envelope))
      )

      // now get into the contents, excluding non-deterministic fields
      expect(actualEnvelopes).excludingEvery(IGNORABLE_KEYS).to.deep.eq(expectedEnvelopes)
    })
  }
})

function parseEnvelopes(raw: string): ReadonlyArray<Envelope> {
  return raw
    .split('\n')
    .filter((line) => !!line)
    .map((line) => JSON.parse(line))
}
