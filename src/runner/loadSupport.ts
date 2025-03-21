import { pathToFileURL } from 'node:url'

import { globby } from 'globby'

import { SupportCodeLibrary } from '../core/SupportCodeLibrary.js'
import { builder } from './state.js'

export async function loadSupport(): Promise<SupportCodeLibrary> {
  const paths = await globby('features/**/*.{cjs,js,mjs,cts,mts,ts}')
  for (const path of paths) {
    await import(pathToFileURL(path).toString())
  }
  return builder.build()
}
