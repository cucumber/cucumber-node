import { SupportCodeLibrary } from '@cucumber/core'
import { PickleStep, PickleStepArgument, PickleStepType, Snippet } from '@cucumber/messages'

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
  const method = METHOD_BY_TYPE[pickleStep.type ?? PickleStepType.UNKNOWN]
  const stepArgument = makeStepArgument(pickleStep.argument)
  return supportCodeLibrary
    .getExpressionGenerator()
    .generateExpressions(pickleStep.text)
    .map((expression) => {
      const allArguments = expression.parameterInfos.map((pi) => {
        return pi.name + (pi.count === 1 ? '' : pi.count.toString())
      })
      if (stepArgument) {
        allArguments.push(stepArgument)
      }
      const params = allArguments.length > 0 ? `, ${allArguments.join(', ')}` : ''
      const code = `${method}(${JSON.stringify(expression.source)}, (t${params}) => {
  t.todo()
})`
      return {
        language: 'javascript',
        code,
      }
    })
}

function makeStepArgument(pickleStepArgument: PickleStepArgument | undefined) {
  if (pickleStepArgument?.dataTable) {
    return 'dataTable'
  } else if (pickleStepArgument?.docString) {
    return 'docString'
  }
  return ''
}
