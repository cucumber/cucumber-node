import { describe, it } from 'mocha'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, use } from 'chai'
import chaiExclude from 'chai-exclude'
import { makeTestHarness } from '../utils.js'
import { globSync } from 'node:fs'
import { Envelope } from '@cucumber/messages'
import { Env } from '@cucumber/ci-environment'

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
  'retry', // node:test doesnt support retries yet
]

const OVERRIDES: Record<string, (actual: ReadonlyArray<Envelope>) => ReadonlyArray<Envelope>> = {
  pending: (actual) => {
    // node:test treats pending (aka todo) as a pass
    return actual.map((envelope) => {
      if (envelope.testRunFinished) {
        return {
          testRunFinished: {
            ...envelope.testRunFinished,
            success: false,
          },
        }
      }
      return envelope
    })
  },
}

describe('Cucumber Compatibility Kit', () => {
  const ndjsonPaths = globSync('node_modules/@cucumber/compatibility-kit/features/**/*.ndjson')
  for (const ndjsonPath of ndjsonPaths) {
    const [, name, extension] = /^.+[/\\](.+)(\.feature(?:\.md)?)\.ndjson$/.exec(
      ndjsonPath
    ) as RegExpExecArray

    it(name, async function () {
      if (UNSUPPORTED.includes(name)) {
        return this.skip()
      }

      const harness = await makeTestHarness()

      await harness.copyDir(path.join(process.cwd(), 'test', 'cck', name), 'features')
      await harness.copyFile(
        path.join(CCK_PATH, 'features', name, name + extension),
        path.join('features', name + extension)
      )

      const [actualOutput] = await harness.run('@cucumber/node/reporters/message')
      const expectedOutput = await readFile(ndjsonPath, { encoding: 'utf-8' })

      let actualEnvelopes = parseEnvelopes(actualOutput)
      if (OVERRIDES[name]) {
        actualEnvelopes = OVERRIDES[name](actualEnvelopes)
      }
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
