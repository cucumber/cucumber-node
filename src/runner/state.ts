import { DiagnosticMessagesCollector, NoopMessagesCollector } from './MessagesCollector.js'
import { SupportCodeBuilder } from './SupportCodeBuilder.js'

export const builder = new SupportCodeBuilder()

/*
If no reporter is listening for messages, we provide
a no-op implementation to avoid cluttering the diagnostic output of the normal reporters.
 */
export const messages = process.env.CUCUMBER_MESSAGES_LISTENING
  ? new DiagnosticMessagesCollector()
  : new NoopMessagesCollector()
