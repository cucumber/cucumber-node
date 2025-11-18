import path from 'node:path'

import * as t from '@babel/types'
import { Location, Pickle } from '@cucumber/messages'

export function mapSourceLocation(pickle: Pickle, location?: Location): t.SourceLocation {
  const position = location
    ? { line: location.line, column: location.column ? location.column - 1 : 0, index: 0 }
    : {
        line: 1,
        column: 0,
        index: 0,
      }
  return {
    start: position,
    end: position,
    filename: path.basename(pickle.uri),
    identifierName: undefined,
  }
}
