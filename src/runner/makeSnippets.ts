import path from 'node:path'

import { generate } from '@babel/generator'
import * as t from '@babel/types'
import { SupportCodeLibrary } from '@cucumber/core'
import { PickleStep, PickleStepType, Snippet } from '@cucumber/messages'

const TYPESCRIPT_EXTENSIONS = ['.ts', '.cts', '.mts', '.tsx']

const METHOD_BY_TYPE: Record<PickleStepType, string> = {
  [PickleStepType.CONTEXT]: 'Given',
  [PickleStepType.ACTION]: 'When',
  [PickleStepType.OUTCOME]: 'Then',
  [PickleStepType.UNKNOWN]: 'Given',
}

export function makeSnippets(
  pickleStep: PickleStep,
  supportCodeLibrary: SupportCodeLibrary
): ReadonlyArray<Snippet> {
  const language = detectLanguage(supportCodeLibrary)
  const method = METHOD_BY_TYPE[pickleStep.type ?? PickleStepType.UNKNOWN]
  return supportCodeLibrary
    .getExpressionGenerator()
    .generateExpressions(pickleStep.text)
    .map((expression) => {
      const args = [t.identifier('t')]
      for (const pi of expression.parameterInfos) {
        const variableName = pi.name + (pi.count === 1 ? '' : pi.count.toString())
        args.push(t.identifier(variableName))
      }
      if (pickleStep.argument?.dataTable) {
        args.push(t.identifier('dataTable'))
      } else if (pickleStep.argument?.docString) {
        args.push(t.identifier('docString'))
      }

      const statement = t.expressionStatement(
        t.callExpression(t.identifier(method), [
          t.stringLiteral(expression.source),
          t.arrowFunctionExpression(
            args,
            t.blockStatement([
              t.expressionStatement(
                t.callExpression(t.memberExpression(t.identifier('t'), t.identifier('todo')), [])
              ),
            ])
          ),
        ])
      )

      const output = generate(statement, {
        retainLines: false,
        compact: false,
        jsescOption: { quotes: 'single' },
      })

      return {
        language,
        code: output.code,
      }
    })
}

function detectLanguage(supportCodeLibrary: SupportCodeLibrary) {
  return supportCodeLibrary
    .getAllSources()
    .map((source) => source.uri)
    .filter((uri) => !!uri)
    .map((uri) => path.extname(uri as string))
    .some((extension) => TYPESCRIPT_EXTENSIONS.includes(extension)) ? 'typescript' : 'javascript'
}
