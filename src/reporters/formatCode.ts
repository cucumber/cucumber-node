import { highlight } from '@babel/code-frame'
import type { Snippet } from '@cucumber/messages'

export function formatCode(snippet: Snippet) {
  return highlight(snippet.code)
}
