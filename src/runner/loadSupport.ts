import { pathToFileURL } from 'node:url'

import { globby } from 'globby'

import { builder } from './state.js'

export async function loadSupport() {
  const paths = await globby('features/**/*.{cjs,js,mjs,cts,mts,ts}')
  for (const path of paths) {
    await import(pathToFileURL(path).toString())
  }
  return {
    library: builder.toLibrary(),
    worldFactory: builder.toWorldFactory(),
  }
}
