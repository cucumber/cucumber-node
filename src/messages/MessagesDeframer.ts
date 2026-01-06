import { envelopesSubject } from './envelopesSubject.js'
import { EnvelopeFromFile } from './types.js'

export class MessagesDeframer {
  private buffer = ''

  handle(data: Buffer<ArrayBuffer>) {
    this.buffer += data.toString()

    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line) {
        const item = JSON.parse(line.toString()) as EnvelopeFromFile
        envelopesSubject.next(item)
      }
    }
  }
}
