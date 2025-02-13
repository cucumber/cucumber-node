export class AmbiguousError extends Error {
  constructor() {
    super('Multiple matching step definitions found')
  }
}
