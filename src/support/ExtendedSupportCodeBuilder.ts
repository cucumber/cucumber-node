import { AttachmentsSupport, World } from '../types.js'
import { WorldFactory } from './WorldFactory.js'

export class ExtraSupportCodeBuilder {
  #worldCreator: (attachmentsSupport: AttachmentsSupport) => World | PromiseLike<World> = (
    attachmentsSupport
  ) => ({ ...attachmentsSupport })
  #worldDestroyer: (world: World) => void | PromiseLike<void> = () => {}

  worldCreator(creator: (attachmentsSupport: AttachmentsSupport) => World | PromiseLike<World>) {
    this.#worldCreator = creator
  }

  worldDestroyer(destroyer: (world: World) => void | PromiseLike<void>) {
    this.#worldDestroyer = destroyer
  }

  build() {
    return new WorldFactory(this.#worldCreator, this.#worldDestroyer)
  }
}
