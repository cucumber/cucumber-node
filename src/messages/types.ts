import type { Envelope } from '@cucumber/messages'
import type { ReadonlyDeep } from 'type-fest'

export type EnvelopeFromFile = {
  file: string
  envelope: ReadonlyDeep<Envelope>
}
