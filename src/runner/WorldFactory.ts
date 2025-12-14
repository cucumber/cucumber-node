import { AttachmentsSupport, World } from '../types.js'

export class WorldFactory {
  constructor(
    private readonly creator: (
      attachmentsSupport: AttachmentsSupport
    ) => World | PromiseLike<World>,
    private readonly destroyer: (world: World) => void | PromiseLike<void>
  ) {}

  async create(attachmentsSupport: AttachmentsSupport): Promise<World> {
    return this.creator(attachmentsSupport)
  }

  async destroy(world: World): Promise<void> {
    await this.destroyer(world)
  }
}
