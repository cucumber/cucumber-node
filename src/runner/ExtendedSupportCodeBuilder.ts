import { Promisable } from 'type-fest'

import { World } from '../types.js'
import { WorldFactory } from './WorldFactory.js'

export class ExtraSupportCodeBuilder {
  #worldCreator: () => Promisable<World> = () => ({})
  #worldDestroyer: (world: World) => Promisable<void> = () => {}

  worldCreator(creator: () => Promisable<World>) {
    this.#worldCreator = creator
  }

  worldDestroyer(destroyer: (world: World) => Promisable<void>) {
    this.#worldDestroyer = destroyer
  }

  build() {
    return new WorldFactory(this.#worldCreator, this.#worldDestroyer)
  }
}
