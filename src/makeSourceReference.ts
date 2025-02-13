import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { SourceReference } from '@cucumber/messages'
import StackUtils from 'stack-utils'

export function makeSourceReference(): SourceReference {
  const cwd = process.cwd()
  const stackUtils = new StackUtils({ cwd })
  // first two call sites are this function and our entry point
  const [, , callSite] = stackUtils.capture()
  let uri = callSite.getFileName()
  if (uri && uri.startsWith('file://')) {
    uri = path.relative(cwd, fileURLToPath(new URL(uri)))
  }
  return {
    uri,
    location: {
      line: callSite.getLineNumber(),
      column: callSite.getColumnNumber(),
    },
  }
}
