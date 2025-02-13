import { glob } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import { builder } from './state.js'
import { SupportCodeLibrary } from './SupportCodeLibrary.js'

export async function loadSupport(): Promise<SupportCodeLibrary> {
  for await (const file of glob('features/**/*.{cjs,js,mjs}')) {
    await import(pathToFileURL(file).toString())
  }
  return builder.build()
}
