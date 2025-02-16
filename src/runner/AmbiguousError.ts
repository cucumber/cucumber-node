import { SourceReference } from '@cucumber/messages'

export class AmbiguousError extends Error {
  constructor(text: string, locations: ReadonlyArray<SourceReference>) {
    super(
      `Multiple matching step definitions found for text "${text}":` +
        '\n' +
        locations
          .map(
            (ref, index) =>
              `${index + 1}) ${ref.uri}:${ref.location?.line ?? '?'}:${ref.location?.column ?? '?'}`
          )
          .join('\n')
    )
  }
}
