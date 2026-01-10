/**
 * Run this file to manually verify the output of our Gherkin module loader in your
 * terminal. Includes syntax highlighting.
 */

import { LoadFnOutput, LoadHookContext } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

// @ts-expect-error incomplete types
import { highlight } from '@babel/code-frame'

import { load } from '../../src/loader/index.js'

const transpiled = await load(
  pathToFileURL(path.join(import.meta.dirname, './sample.feature')).toString(),
  {} as LoadHookContext,
  () => ({}) as LoadFnOutput
)

process.stdout.write('\n' + highlight(transpiled.source) + '\n')
