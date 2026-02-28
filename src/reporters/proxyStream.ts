import { WriteStream } from 'node:tty'

/**
 * Captures attempts to write to a stream, but otherwise passes through all accessors. Useful for
 * exposing the underlying stream for feature detection while still controlling writes.
 * @param stream
 * @param write
 */
export function proxyStream(stream: WriteStream, write: (chunk: string) => void): WriteStream {
  return new Proxy(stream, {
    get(target, prop, receiver) {
      if (prop === 'write') {
        return (chunk: string) => {
          write(chunk)
          return true
        }
      }
      return Reflect.get(target, prop, receiver)
    },
  })
}
