import { type ContextMenuCommandSuccessPayload, Events, Listener, LogLevel } from '@sapphire/framework';
import type { Logger } from '@sapphire/plugin-logger';

import { commandRanCounter } from '#src/util';

export class ContextMenuCommandSuccess extends Listener<typeof Events.ContextMenuCommandSuccess> {
  public override run(_payload: ContextMenuCommandSuccessPayload) {
    return commandRanCounter.inc();
  }

  public override onLoad() {
    this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
    return super.onLoad();
  }
}
