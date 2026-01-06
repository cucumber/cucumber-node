import { connect } from 'node:net'

import { deriveSocketPath } from './deriveSocketPath.js'
import { envelopesSubject } from './envelopesSubject.js'

export async function setupMessageWriting() {
  const listenerPid = process.env.CUCUMBER_MESSAGES_LISTENING
  const runnerPid = process.pid.toString()

  if (listenerPid && listenerPid !== runnerPid) {
    return new Promise<void>((resolve) => {
      const socketPath = deriveSocketPath(listenerPid)
      const client = connect(socketPath, resolve)

      envelopesSubject.subscribe((envelope) => {
        client.write(JSON.stringify(envelope) + '\n')
      })

      client.unref()
    })
  }
}
