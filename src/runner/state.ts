import { SupportCodeBuilder } from '../core/SupportCodeBuilder.js'
import { makeId } from '../makeId.js'
import { DiagnosticMessagesCollector, NoopMessagesCollector } from './MessagesCollector.js'

export const builder = new SupportCodeBuilder(makeId)

/*
If no reporter is listening for messages, we provide
a no-op implementation to avoid cluttering the diagnostic output of the normal reporters.
 */
export const messages = process.env.CUCUMBER_MESSAGES_LISTENING
  ? new DiagnosticMessagesCollector()
  : new NoopMessagesCollector()
