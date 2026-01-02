import { unlinkSync } from 'node:fs'
import { createServer } from 'node:net'

import { Envelope } from '@cucumber/messages'
import { Buffer } from 'buffer'

import { deriveSocketPath } from './deriveSocketPath.js'
import { eventEmitter } from './eventEmitter.js'

export async function setupMessageListening() {
  const pid = process.pid.toString()
  process.env.CUCUMBER_MESSAGES_LISTENING = pid

  return new Promise<void>((resolve) => {
    const socketPath = deriveSocketPath(pid)

    if (isUnixSocket(socketPath)) {
      try {
        unlinkSync(socketPath)
      } catch {
        // noop
      }
    }

    const server = createServer((socket) => {
      const deframer = new Deframer()
      socket.on('data', (data) => {
        deframer.handle(data)
      })
    })

    server.listen(socketPath, resolve)
    server.unref()
  })
}

function isUnixSocket(socketPath: string) {
  return socketPath.startsWith('/tmp')
}

class Deframer {
  private buffer = ''

  handle(data: Buffer<ArrayBuffer>) {
    this.buffer += data.toString()

    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line) {
        const envelope = JSON.parse(line.toString()) as Envelope
        eventEmitter.emit('envelope', envelope)
      }
    }
  }
}
