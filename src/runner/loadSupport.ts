import { glob } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

import type { SupportCodeLibrary } from '@cucumber/core'

import { coreBuilder, extraBuilder, type WorldFactory } from '../support/index.js'

interface UsableSupport {
  supportCodeLibrary: SupportCodeLibrary
  worldFactory: WorldFactory
}

let supportPromise: Promise<UsableSupport>

async function loadSupportInternal() {
  for await (const path of glob('features/**/*.{cjs,js,mjs,cts,mts,ts}')) {
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
