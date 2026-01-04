import { Envelope } from '@cucumber/messages'
import { ReplaySubject } from 'rxjs'

export const envelopes$ = new ReplaySubject<Envelope>()
