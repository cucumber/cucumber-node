import { Group as ExpressionsGroup } from '@cucumber/cucumber-expressions'
import { Envelope, Group as MessagesGroup, Pickle, TestCase, TestStep } from '@cucumber/messages'

import { DataTable } from '../DataTable.js'
import { makeId } from '../makeId.js'
import { StepFunction } from '../types.js'
import { AmbiguousError } from './AmbiguousError.js'
import { SupportCodeLibrary } from './SupportCodeLibrary.js'
import { UndefinedError } from './UndefinedError.js'

export type Runnable = {
  fn: StepFunction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: ReadonlyArray<any>
}

export interface AssembledTestPlan {
  testCases: ReadonlyArray<AssembledTestCase>
  toEnvelopes(): ReadonlyArray<Envelope>
}

export interface AssembledTestCase {
  id: string
  name: string
  steps: ReadonlyArray<AssembledStep>
  toMessage(): TestCase
}

export interface AssembledStep {
  id: string
  name: string
  always: boolean
  prepare(): Runnable
  toMessage(): TestStep
}

export function makeTestPlan(
  pickles: ReadonlyArray<Pickle>,
  library: SupportCodeLibrary
): AssembledTestPlan {
  return {
    testCases: pickles.map((pickle) => {
      return {
        id: makeId(),
        name: pickle.name,
        steps: [
          ...fromBeforeHooks(pickle, library),
          ...fromPickleSteps(pickle, library),
          ...fromAfterHooks(pickle, library),
        ],
        toMessage() {
          return {
            id: this.id,
            pickleId: pickle.id,
            testSteps: this.steps.map((step) => step.toMessage()),
          }
        },
      }
    }),
    toEnvelopes() {
      return this.testCases.map((tc) => ({ testCase: tc.toMessage() }))
    },
  }
}

function fromBeforeHooks(
  pickle: Pickle,
  library: SupportCodeLibrary
): ReadonlyArray<AssembledStep> {
  return library.findAllBeforeHooksBy(pickle.tags.map((tag) => tag.name)).map((def) => {
    return {
      id: makeId(),
      name: def.name ?? '',
      always: false,
      prepare() {
        return {
          fn: def.fn,
          args: [],
        }
      },
      toMessage() {
        return {
          id: this.id,
          hookId: def.id,
        }
      },
    }
  })
}

function fromAfterHooks(pickle: Pickle, library: SupportCodeLibrary): ReadonlyArray<AssembledStep> {
  return library
    .findAllAfterHooksBy(pickle.tags.map((tag) => tag.name))
    .toReversed()
    .map((def) => {
      return {
        id: makeId(),
        name: def.name ?? '',
        always: true,
        prepare() {
          return {
            fn: def.fn,
            args: [],
          }
        },
        toMessage() {
          return {
            id: this.id,
            hookId: def.id,
          }
        },
      }
    })
}

function fromPickleSteps(
  pickle: Pickle,
  library: SupportCodeLibrary
): ReadonlyArray<AssembledStep> {
  return pickle.steps.map((pickleStep) => {
    const matched = library.findAllStepsBy(pickleStep.text)
    return {
      id: makeId(),
      name: pickleStep.text,
      always: false,
      prepare() {
        if (matched.length < 1) {
          throw new UndefinedError(pickleStep.text)
        } else if (matched.length > 1) {
          throw new AmbiguousError(
            pickleStep.text,
            matched.map(({ def }) => def.sourceReference)
          )
        } else {
          const { def, args } = matched[0]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allArgs: Array<any> = args.map((arg) => arg.getValue(undefined))
          if (pickleStep.argument?.docString) {
            allArgs.push(pickleStep.argument.docString.content)
          } else if (pickleStep.argument?.dataTable) {
            allArgs.push(
              new DataTable(
                pickleStep.argument.dataTable.rows.map((row) => {
                  return row.cells.map((cell) => cell.value)
                })
              )
            )
          }
          return {
            fn: def.fn,
            args: allArgs,
          }
        }
      },
      toMessage() {
        return {
          id: this.id,
          pickleStepId: pickleStep.id,
          stepDefinitionIds: matched.map(({ def }) => def.id),
          stepMatchArgumentsLists: matched.map(({ args }) => {
            return {
              stepMatchArguments:
                args.map((arg) => {
                  return {
                    group: mapArgumentGroup(arg.group),
                    parameterTypeName: arg.parameterType.name,
                  }
                }) ?? [],
            }
          }),
        }
      },
    }
  })
}

function mapArgumentGroup(group: ExpressionsGroup): MessagesGroup {
  return {
    start: group.start,
    value: group.value,
    children: group.children.map((child) => mapArgumentGroup(child)),
  }
}
