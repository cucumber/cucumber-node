import { Promisable } from 'type-fest'

import { World } from '../types.js'

export class WorldFactory {
  constructor(
    private readonly creator: () => Promisable<World>,
    private readonly destroyer: (world: World) => Promisable<void>
  ) {}

  async create(): Promise<World> {
    return this.creator()
  }

  async destroy(world: World): Promise<void> {
    await this.destroyer(world)
  }
}
