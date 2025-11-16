import { GherkinDocument, Pickle, Source } from '@cucumber/messages'

export interface CompiledGherkin {
  source: Source
  gherkinDocument: GherkinDocument
  pickles: ReadonlyArray<Pickle>
}
