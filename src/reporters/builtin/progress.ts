import { TestEvent } from 'node:test/reporters'

import { TestStepResultStatus } from '@cucumber/messages'
import chalk from 'chalk'

import { mapTestStepResult } from '../mapTestStepResult.js'

const CHARACTER_BY_STATUS: Record<TestStepResultStatus, string> = {
  [TestStepResultStatus.AMBIGUOUS]: chalk.red('A'),
  [TestStepResultStatus.FAILED]: chalk.red('F'),
  [TestStepResultStatus.PASSED]: chalk.green('.'),
  [TestStepResultStatus.PENDING]: chalk.yellow('P'),
  [TestStepResultStatus.SKIPPED]: chalk.cyan('-'),
  [TestStepResultStatus.UNDEFINED]: chalk.red('U'),
  [TestStepResultStatus.UNKNOWN]: chalk.gray('?'),
}

export default async function* (source: AsyncIterable<TestEvent>): AsyncGenerator<string> {
  let allScenarios = 0
  let passedScenarios = 0
  let allSteps = 0
  let passedSteps = 0
  for await (const event of source) {
    switch (event.type) {
      case 'test:fail':
      case 'test:pass': {
        const { status } = mapTestStepResult(event.data)
        if (event.data.nesting === 1) {
          // scenario-level
          allScenarios++
          if (status === TestStepResultStatus.PASSED) {
            passedScenarios++
          }
        } else if (event.data.nesting === 2) {
          // step-level
          allSteps++
          if (status === TestStepResultStatus.PASSED) {
            passedSteps++
          }
          yield CHARACTER_BY_STATUS[status]
        }
        break
      }
      default:
        break
    }
  }
  yield '\n\n'
  yield `${allScenarios} scenarios (${passedScenarios} passed)` + '\n'
  yield `${allSteps} steps (${passedSteps} passed)` + '\n'
}
