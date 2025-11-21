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
import { generateCode } from './generateCode.js'

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
