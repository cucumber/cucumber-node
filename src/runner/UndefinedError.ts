export class UndefinedError extends Error {
  constructor() {
    super('No matching step definitions found')
  }
}
