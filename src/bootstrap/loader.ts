import fs from 'node:fs'
import { LoadHook } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  AstBuilder,
  compile,
  GherkinClassicTokenMatcher,
  GherkinInMarkdownTokenMatcher,
  Parser,
} from '@cucumber/gherkin'
import { Source, SourceMediaType } from '@cucumber/messages'

import { newId } from '../newId.js'
import { CompiledGherkin } from '../runner/index.js'

export const load: LoadHook = async (url, context, nextLoad) => {
  if (url.endsWith('.feature.md') || url.endsWith('.feature')) {
    const data = fs.readFileSync(new URL(url), { encoding: 'utf-8' })
    const uri = path.relative(process.cwd(), fileURLToPath(url))
    const mediaType =
      path.extname(uri) === '.md'
        ? SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_MARKDOWN
        : SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN
    const builder = new AstBuilder(newId)
    const matcher =
      mediaType === SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_MARKDOWN
        ? new GherkinInMarkdownTokenMatcher()
        : new GherkinClassicTokenMatcher()
    const parser = new Parser(builder, matcher)
    const source: Source = {
      uri,
      data,
      mediaType,
    }
    const gherkinDocument = {
      uri,
      ...parser.parse(data),
    }
    const pickles = compile(gherkinDocument, uri, newId)
    return {
      format: 'module',
      shortCircuit: true,
      source: generateCode({ source, gherkinDocument, pickles }),
    }
  }
  return nextLoad(url)
}

function generateCode(gherkin: CompiledGherkin) {
  return `import { suite, test } from 'node:test'
import { prepare } from '@cucumber/node/runner'

const plan = await prepare(${JSON.stringify(gherkin)})
await suite(plan.name, async () => {
  ${gherkin.pickles
    .map((pickle, index) => {
      return `const testCase${index} = plan.select(${JSON.stringify(pickle.id)})
      await test(testCase${index}.name, async (ctx1) => {
        await testCase${index}.setup(ctx1)
        for (const testStep of testCase${index}.testSteps) {
          await testStep.setup()
          await ctx1.test(testStep.name, testStep.options, async (ctx2) => {
            await testStep.execute(ctx2)
          })
          await testStep.teardown()
        }
        await testCase${index}.teardown()
      })`
    })
    .join('\n')}
})
`
}
