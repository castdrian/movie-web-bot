import { type ContextMenuCommandSuccessPayload, Events, Listener } from '@sapphire/framework';

import { commandRanCounter } from '#src/util';

export class ContextMenuCommandSuccess extends Listener<typeof Events.ContextMenuCommandSuccess> {
  public override run(_payload: ContextMenuCommandSuccessPayload) {
    return commandRanCounter.inc();
  }
}
