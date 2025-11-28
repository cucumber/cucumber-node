import path from 'node:path'

import { buildSupportCode, SupportCodeLibrary } from '@cucumber/core'
import { PickleStep, PickleStepType } from '@cucumber/messages'
import { expect } from 'chai'

import { makeSnippets } from './makeSnippets.js'

describe('makeSnippets', () => {
  describe('without typescript sources', () => {
    let supportCodeLibrary: SupportCodeLibrary

    before(() => {
      supportCodeLibrary = buildSupportCode()
        .parameterType({
          name: 'flight',
          regexp: /([A-Z]{3})-([A-Z]{3})/,
          transformer: (from, to) => ({ from, to }),
          sourceReference: {
            uri: path.join('features', 'support.js'),
          },
        })
        .step({
          pattern: 'some unused step',
          fn: () => {},
          sourceReference: {
            uri: path.join('features', 'steps.js'),
          },
        })
        .build()
    })

    it('generates snippet for Given step with plain text', () => {
      const pickleStep: PickleStep = {
        id: 'step-1',
        text: 'I have a simple step',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `Given('I have a simple step', t => {
  t.todo();
});`
      )
    })

    it('generates snippet for When step with plain text', () => {
      const pickleStep: PickleStep = {
        id: 'step-2',
        text: 'I do something',
        type: PickleStepType.ACTION,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `When('I do something', t => {
  t.todo();
});`
      )
    })

    it('generates snippet for Then step with plain text', () => {
      const pickleStep: PickleStep = {
        id: 'step-3',
        text: 'the result should be visible',
        type: PickleStepType.OUTCOME,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `Then('the result should be visible', t => {
  t.todo();
});`
      )
    })

    it('generates snippet for step with unknown type', () => {
      const pickleStep: PickleStep = {
        id: 'step-4',
        text: 'some unknown step',
        type: PickleStepType.UNKNOWN,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `Given('some unknown step', t => {
  t.todo();
});`
      )
    })

    it('generates snippet with string parameter', () => {
      const pickleStep: PickleStep = {
        id: 'step-5',
        text: 'I have a "cucumber" in my basket',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `Given('I have a {string} in my basket', (t, string) => {
  t.todo();
});`
      )
    })

    it('generates snippet with multiple string parameters', () => {
      const pickleStep: PickleStep = {
        id: 'step-6',
        text: 'I put "apples" and "oranges" together',
        type: PickleStepType.ACTION,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `When('I put {string} and {string} together', (t, string, string2) => {
  t.todo();
});`
      )
    })

    it('generates snippet with number parameter', () => {
      const pickleStep: PickleStep = {
        id: 'step-7',
        text: 'I have 42 cucumbers',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      // integers generate both int and float snippets
      expect(snippets).to.have.lengthOf(2)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `Given('I have {int} cucumbers', (t, int) => {
  t.todo();
});`
      )
      expect(snippets[1].language).to.eq('javascript')
      expect(snippets[1].code).to.eq(
        `Given('I have {float} cucumbers', (t, float) => {
  t.todo();
});`
      )
    })

    it('generates snippet with custom parameter type', () => {
      const pickleStep: PickleStep = {
        id: 'step-8',
        text: 'LHR-CDG has been delayed',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `Given('{flight} has been delayed', (t, flight) => {
  t.todo();
});`
      )
    })

    it('generates snippet with DataTable parameter', () => {
      const pickleStep: PickleStep = {
        id: 'step-9',
        text: 'I have the following items',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
        argument: {
          dataTable: {
            rows: [
              { cells: [{ value: 'item' }, { value: 'quantity' }] },
              { cells: [{ value: 'apple' }, { value: '5' }] },
            ],
          },
        },
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `Given('I have the following items', (t, dataTable) => {
  t.todo();
});`
      )
    })

    it('generates snippet with docString parameter', () => {
      const pickleStep: PickleStep = {
        id: 'step-10',
        text: 'I have the following text',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
        argument: {
          docString: {
            content: 'Some multiline\ntext here',
            mediaType: 'text/plain',
          },
        },
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('javascript')
      expect(snippets[0].code).to.eq(
        `Given('I have the following text', (t, docString) => {
  t.todo();
});`
      )
    })
  })

  describe('with typescript sources', () => {
    let supportCodeLibrary: SupportCodeLibrary

    before(() => {
      supportCodeLibrary = buildSupportCode()
        .parameterType({
          name: 'flight',
          regexp: /([A-Z]{3})-([A-Z]{3})/,
          transformer: (from, to) => ({ from, to }),
          sourceReference: {
            uri: path.join('features', 'support.ts'),
          },
        })
        .step({
          pattern: 'some unused step',
          fn: () => {},
          sourceReference: {
            uri: path.join('features', 'steps.ts'),
          },
        })
        .build()
    })

    it('generates snippet with string parameter', () => {
      const pickleStep: PickleStep = {
        id: 'step-5',
        text: 'I have a "cucumber" in my basket',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('typescript')
      expect(snippets[0].code).to.eq(
        `Given('I have a {string} in my basket', (t, string: string) => {
  t.todo();
});`
      )
    })

    it('generates snippet with multiple string parameters', () => {
      const pickleStep: PickleStep = {
        id: 'step-6',
        text: 'I put "apples" and "oranges" together',
        type: PickleStepType.ACTION,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('typescript')
      expect(snippets[0].code).to.eq(
        `When('I put {string} and {string} together', (t, string: string, string2: string) => {
  t.todo();
});`
      )
    })

    it('generates snippet with number parameter', () => {
      const pickleStep: PickleStep = {
        id: 'step-7',
        text: 'I have 42 cucumbers',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      // integers generate both int and float snippets
      expect(snippets).to.have.lengthOf(2)
      expect(snippets[0].language).to.eq('typescript')
      expect(snippets[0].code).to.eq(
        `Given('I have {int} cucumbers', (t, int: number) => {
  t.todo();
});`
      )
      expect(snippets[1].language).to.eq('typescript')
      expect(snippets[1].code).to.eq(
        `Given('I have {float} cucumbers', (t, float: number) => {
  t.todo();
});`
      )
    })

    it('generates snippet with custom parameter type', () => {
      const pickleStep: PickleStep = {
        id: 'step-8',
        text: 'LHR-CDG has been delayed',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('typescript')
      expect(snippets[0].code).to.eq(
        `Given('{flight} has been delayed', (t, flight) => {
  t.todo();
});`
      )
    })

    it('generates snippet with DataTable parameter', () => {
      const pickleStep: PickleStep = {
        id: 'step-9',
        text: 'I have the following items',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
        argument: {
          dataTable: {
            rows: [
              { cells: [{ value: 'item' }, { value: 'quantity' }] },
              { cells: [{ value: 'apple' }, { value: '5' }] },
            ],
          },
        },
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('typescript')
      expect(snippets[0].code).to.eq(
        `Given('I have the following items', (t, dataTable: DataTable) => {
  t.todo();
});`
      )
    })

    it('generates snippet with docString parameter', () => {
      const pickleStep: PickleStep = {
        id: 'step-10',
        text: 'I have the following text',
        type: PickleStepType.CONTEXT,
        astNodeIds: [],
        argument: {
          docString: {
            content: 'Some multiline\ntext here',
            mediaType: 'text/plain',
          },
        },
      }

      const snippets = makeSnippets(pickleStep, supportCodeLibrary)

      expect(snippets).to.have.lengthOf(1)
      expect(snippets[0].language).to.eq('typescript')
      expect(snippets[0].code).to.eq(
        `Given('I have the following text', (t, docString: string) => {
  t.todo();
});`
      )
    })
  })
})
