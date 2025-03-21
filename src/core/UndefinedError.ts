export class UndefinedError extends Error {
  constructor(text: string) {
    super(`No matching step definitions found for text "${text}"`)
  }
}
