import path from 'node:path'

import {
  AstBuilder,
  compile,
  GherkinClassicTokenMatcher,
  GherkinInMarkdownTokenMatcher,
  Parser,
} from '@cucumber/gherkin'
import { SourceMediaType } from '@cucumber/messages'

import { newId } from '../newId.js'
import { CompiledGherkin } from '../runner/index.js'

export function compileGherkin(uri: string, data: string): CompiledGherkin {
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
  const source = {
    uri,
    data,
    mediaType,
  }
  const gherkinDocument = {
    uri,
    ...parser.parse(data),
  }
  const pickles = compile(gherkinDocument, uri, newId)
  return { source, gherkinDocument, pickles }
}
