import { Promisable } from 'type-fest'

import { AttachmentsSupport, World } from '../types.js'

export class WorldFactory {
  constructor(
    private readonly creator: (attachmentsSupport: AttachmentsSupport) => Promisable<World>,
    private readonly destroyer: (world: World) => Promisable<void>
  ) {}

  async create(attachmentsSupport: AttachmentsSupport): Promise<World> {
    return this.creator(attachmentsSupport)
  }

  async destroy(world: World): Promise<void> {
    await this.destroyer(world)
  }
}
