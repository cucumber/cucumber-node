import fs from 'node:fs'
import { LoadHook } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { compileGherkin } from './compileGherkin.js'
import { generateCode } from './generateCode.js'

export const load: LoadHook = async (url, context, nextLoad) => {
  if (url.endsWith('.feature.md') || url.endsWith('.feature')) {
    const data = fs.readFileSync(new URL(url), { encoding: 'utf-8' })
    const uri = path.relative(process.cwd(), fileURLToPath(url))
    const compiled = compileGherkin(uri, data)
    return {
      format: 'module',
      shortCircuit: true,
      source: generateCode(compiled),
    }
  }
  return nextLoad(url)
}
