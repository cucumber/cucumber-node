import { Envelope } from '@cucumber/messages'
import { ReadonlyDeep } from 'type-fest'

export type EnvelopeFromFile = {
  file: string
  envelope: ReadonlyDeep<Envelope>
}
