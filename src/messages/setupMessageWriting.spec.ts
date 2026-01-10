import { createServer, Server, Socket } from 'node:net'

import { SourceMediaType } from '@cucumber/messages'

import { deriveSocketPath } from './deriveSocketPath.js'
import { EnvelopesReplaySubject } from './EnvelopesReplaySubject.js'
import { setupMessageWriting } from './setupMessageWriting.js'

describe('setupMessageWriting', () => {
  afterEach(() => {
    delete process.env.CUCUMBER_MESSAGES_LISTENING
  })

  it('handles gracefully when the socket does not exist', async () => {
    process.env.CUCUMBER_MESSAGES_LISTENING = 'fake-pid'
    const subject = new EnvelopesReplaySubject()
    subject.next({
      file: 'test.feature',
      envelope: {
        source: {
          uri: 'test.feature',
          data: '',
          mediaType: SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
        },
      },
    })
    subject.next({
      file: 'test.feature',
      envelope: {
        pickle: {
          id: '1',
          uri: 'test.feature',
          name: 'test',
          language: 'en',
          steps: [],
          tags: [],
          astNodeIds: [],
        },
      },
    })

    await setupMessageWriting(subject)
  })

  it('handles gracefully when the server closes mid-stream', async () => {
    const fakePid = 'fake-pid-server'
    process.env.CUCUMBER_MESSAGES_LISTENING = fakePid
    const socketPath = deriveSocketPath(fakePid)

    // start a server
    let clientSocket: Socket | undefined
    const server: Server = await new Promise((resolve) => {
      const s = createServer((socket) => {
        clientSocket = socket
      })
      s.listen(socketPath, () => resolve(s))
    })

    const subject = new EnvelopesReplaySubject()
    await setupMessageWriting(subject)

    // push some envelopes while connected
    subject.next({
      file: 'test.feature',
      envelope: {
        source: {
          uri: 'test.feature',
          data: '',
          mediaType: SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN,
        },
      },
    })

    // abruptly close the client connection and the server itself
    clientSocket?.destroy()
    await new Promise<void>((resolve) => server.close(() => resolve()))

    // push more envelopes after disconnected
    subject.next({
      file: 'test.feature',
      envelope: {
        pickle: {
          id: '1',
          uri: 'test.feature',
          name: 'test',
          language: 'en',
          steps: [],
          tags: [],
          astNodeIds: [],
        },
      },
    })
  })
})
