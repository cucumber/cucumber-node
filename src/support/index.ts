import { buildSupportCode } from '@cucumber/core'

import { ExtraSupportCodeBuilder } from './ExtendedSupportCodeBuilder.js'

export * from './ExtendedSupportCodeBuilder.js'
export * from './WorldFactory.js'

export const coreBuilder = buildSupportCode()
export const extraBuilder = new ExtraSupportCodeBuilder()
