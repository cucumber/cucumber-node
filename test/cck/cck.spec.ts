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
  // snippets
  'code',
  'language',
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
  // not a test sample
  'test-run-exception',
]

describe('Cucumber Compatibility Kit', () => {
  let isolationOption = '--test-isolation'
  if (Number(process.versions.node.split('.')[0]) < 24) {
    isolationOption = '--experimental-test-isolation'
  }
  const isolationModes = ['none', 'process']

  for (const isolationMode of isolationModes) {
    describe(`isolation=${isolationMode}`, () => {
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

          const [actualOutput] = await harness.run(
            '@cucumber/node/reporters/message',
            `${isolationOption}=${isolationMode}`
          )
          const expectedOutput = await readFile(path.join(directory, suite + '.ndjson'), {
            encoding: 'utf-8',
          })

          const actualEnvelopes = reorderEnvelopes(parseEnvelopes(actualOutput))
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
  }
})

function parseEnvelopes(raw: string): ReadonlyArray<Envelope> {
  return raw
    .split('\n')
    .filter((line) => !!line)
    .map((line) => JSON.parse(line))
}

/**
 * Finds the TestRunStarted envelope and moves it to just before either the first TestCase
 * envelope, or the TestRunFinished envelope if there are none.
 */
function reorderEnvelopes(original: ReadonlyArray<Envelope>): ReadonlyArray<Envelope> {
  const reordered = [...original]
  const [testRunStartedEnvelope] = reordered.splice(
    reordered.findIndex((envelope) => envelope.testRunStarted),
    1
  )
  reordered.splice(
    reordered.findIndex((envelope) => envelope.testCase || envelope.testRunFinished),
    0,
    testRunStartedEnvelope
  )
  return reordered
}
