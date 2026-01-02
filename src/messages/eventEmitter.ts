import { EventEmitter } from 'node:events'

import { Envelope } from '@cucumber/messages'

export const eventEmitter = new EventEmitter<{
  envelope: [Envelope]
}>()
