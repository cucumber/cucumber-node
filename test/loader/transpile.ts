import { load } from '../../src/loader/index.js'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { LoadFnOutput, LoadHookContext } from 'node:module'

const transpiled = await load(
  pathToFileURL(path.join(import.meta.dirname, './sample.feature')).toString(),
  {} as LoadHookContext,
  () => ({}) as LoadFnOutput
)

process.stdout.write(transpiled.source + '\n')
