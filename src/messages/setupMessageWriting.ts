import { connect } from 'node:net'

import { deriveSocketPath } from './deriveSocketPath.js'
import { eventEmitter } from './eventEmitter.js'

export async function setupMessageWriting() {
  const listenerPid = process.env.CUCUMBER_MESSAGES_LISTENING
  const runnerPid = process.pid.toString()

  if (listenerPid && listenerPid !== runnerPid) {
    return new Promise<void>((resolve) => {
      const socketPath = deriveSocketPath(listenerPid)
      const client = connect(socketPath, resolve)

      eventEmitter.on('envelope', (envelope) => {
        client.write(JSON.stringify(envelope) + '\n')
      })

      client.unref()
    })
  }
}
