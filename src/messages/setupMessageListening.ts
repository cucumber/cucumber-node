import { unlinkSync } from 'node:fs'
import { createServer } from 'node:net'

import { deriveSocketPath } from './deriveSocketPath.js'
import { EnvelopesReplaySubject } from './EnvelopesReplaySubject.js'
import { MessagesDeframer } from './MessagesDeframer.js'

export async function setupMessageListening(subject: EnvelopesReplaySubject) {
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
      /* c8 ignore start */
      const deframer = new MessagesDeframer(subject)
      socket.on('data', (data) => {
        deframer.handle(data)
      })
      /* c8 ignore stop */
    })

    server.listen(socketPath, resolve)
    server.unref()
  })
}

function isUnixSocket(socketPath: string) {
  return socketPath.startsWith('/tmp')
}
