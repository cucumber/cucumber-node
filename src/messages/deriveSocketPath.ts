/* c8 ignore file */
import { platform } from 'node:os'

export function deriveSocketPath(pid: number | string) {
  const identifier = `cucumber-node-messages-${pid}`
  return platform() === 'win32' ? `\\\\.\\pipe\\${identifier}` : `/tmp/${identifier}.sock`
}
