import path from 'node:path'

import * as t from '@babel/types'
import { Location } from '@cucumber/messages'

export function mapLocation(uri: string, location?: Location): t.SourceLocation {
  const position = mapPosition(location)
  return {
    start: position,
    end: position,
    filename: path.basename(uri),
    identifierName: undefined,
  }
}

function mapPosition(location: Location | undefined) {
  if (location) {
    return { line: location.line, column: location.column ? location.column - 1 : 0, index: 0 }
  }
  return {
    line: 1,
    column: 0,
    index: 0,
  }
}
