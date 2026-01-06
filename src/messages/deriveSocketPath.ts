import { platform } from 'node:os'

export function deriveSocketPath(pid: number | string) {
  const identifier = `cucumber-node-messages-${pid}`
  /* c8 ignore next 3 */
  if (platform() === 'win32') {
    return `\\\\.\\pipe\\${identifier}`
  }
  return `/tmp/${identifier}.sock`
}
