import { AssembledTestCase, AssembledTestPlan } from '@cucumber/core'

import { ExecutableTestCase } from './ExecutableTestCase.js'
import { WorldFactory } from './WorldFactory.js'

export class ExecutableTestPlan {
  constructor(
    private readonly worldFactory: WorldFactory,
    private readonly plan: AssembledTestPlan
  ) {}

  get name() {
    return this.plan.name
  }

  select(pickleId: string): ExecutableTestCase {
    // TODO add pickleId to AssembledTestCase, make a Map<string, AssembledTestCase> on plan creation
    const testCase = this.plan.testCases.find(
      (tc) => tc.toMessage().pickleId === pickleId
    ) as AssembledTestCase
    return new ExecutableTestCase(this.worldFactory, testCase)
  }
}
