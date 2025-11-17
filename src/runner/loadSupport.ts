import { pathToFileURL } from 'node:url'

import { SupportCodeLibrary } from '@cucumber/core'
import { globby } from 'globby'

import { coreBuilder, extraBuilder } from './state.js'
import { WorldFactory } from './WorldFactory.js'

interface UsableSupport {
  supportCodeLibrary: SupportCodeLibrary
  worldFactory: WorldFactory
}

let supportPromise: Promise<UsableSupport>

async function loadSupportInternal() {
  const paths = await globby('features/**/*.{cjs,js,mjs,cts,mts,ts}')
  for (const path of paths) {
    await import(pathToFileURL(path).toString())
  }
  return {
    supportCodeLibrary: coreBuilder.build(),
    worldFactory: extraBuilder.build(),
  }
}

export async function loadSupport() {
  if (!supportPromise) {
    supportPromise = loadSupportInternal()
  }
  return await supportPromise
}
