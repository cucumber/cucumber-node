import { connect } from 'node:net'

import { deriveSocketPath } from './deriveSocketPath.js'
import { EnvelopesReplaySubject } from './EnvelopesReplaySubject.js'

export async function setupMessageWriting(subject: EnvelopesReplaySubject) {
  const listenerPid = process.env.CUCUMBER_MESSAGES_LISTENING
  const runnerPid = process.pid.toString()

  if (listenerPid && listenerPid !== runnerPid) {
    return new Promise<void>((resolve) => {
      const socketPath = deriveSocketPath(listenerPid)
      const client = connect(socketPath, resolve)

      client.on('error', (e) => {
        console.warn(
          `cucumber-node caught an error when communicating with listener ${listenerPid}:`,
          e.message
        )
        resolve()
      })

      subject.subscribe((envelope) => {
        client.write(JSON.stringify(envelope) + '\n')
      })

      client.unref()
    })
  }
}
