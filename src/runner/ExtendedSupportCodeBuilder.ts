import { Promisable } from 'type-fest'

import { AttachmentsSupport, World } from '../types.js'
import { WorldFactory } from './WorldFactory.js'

export class ExtraSupportCodeBuilder {
  #worldCreator: (attachmentsSupport: AttachmentsSupport) => Promisable<World> = (
    attachmentsSupport
  ) => ({ ...attachmentsSupport })
  #worldDestroyer: (world: World) => Promisable<void> = () => {}

  worldCreator(creator: (attachmentsSupport: AttachmentsSupport) => Promisable<World>) {
    this.#worldCreator = creator
  }

  worldDestroyer(destroyer: (world: World) => Promisable<void>) {
    this.#worldDestroyer = destroyer
  }

  build() {
    return new WorldFactory(this.#worldCreator, this.#worldDestroyer)
  }
}
