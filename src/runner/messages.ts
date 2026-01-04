import { setupMessageWriting } from '../messages/index.js'
import { MessagesCollector } from './MessagesCollector.js'

await setupMessageWriting()

export const messages = new MessagesCollector()
