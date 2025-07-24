import { buildSupportCode } from '@cucumber/core'

import { ExtraSupportCodeBuilder } from './ExtendedSupportCodeBuilder.js'
import { DiagnosticMessagesCollector, NoopMessagesCollector } from './MessagesCollector.js'

export const coreBuilder = buildSupportCode()
export const extraBuilder = new ExtraSupportCodeBuilder()

/*
If no reporter is listening for messages, we provide
a no-op implementation to avoid cluttering the diagnostic output of the normal reporters.
 */
export const messages = process.env.CUCUMBER_MESSAGES_LISTENING
  ? new DiagnosticMessagesCollector()
  : new NoopMessagesCollector()
