import { Promisable } from 'type-fest'

import { SupportCodeBuilder } from '../core/SupportCodeBuilder.js'
import { makeId } from '../makeId.js'
import { World } from '../types.js'
import { WorldFactory } from './WorldFactory.js'

export class ExtendedSupportCodeBuilder extends SupportCodeBuilder {
  private worldCreator: () => Promisable<World> = () => ({})
  private worldDestroyer: (world: World) => Promisable<void> = () => {}

  constructor() {
    super(makeId)
  }

  registerWorldCreator(creator: () => Promisable<World>) {
    this.worldCreator = creator
  }

  registerWorldDestroyer(destroyer: (world: World) => Promisable<void>) {
    this.worldDestroyer = destroyer
  }

  toWorldFactory() {
    return new WorldFactory(this.worldCreator, this.worldDestroyer)
  }
}
