import { TimeConversion, type Timestamp } from '@cucumber/messages'

export function makeTimestamp(): Timestamp {
  return TimeConversion.millisecondsSinceEpochToTimestamp(Date.now())
}
