import { type ChatInputCommandSuccessPayload, Events, Listener, LogLevel } from '@sapphire/framework';
import type { Logger } from '@sapphire/plugin-logger';

import { commandRanCounter } from '#src/util';

export class ChatInputCommandSuccess extends Listener<typeof Events.ChatInputCommandSuccess> {
  public override run(_payload: ChatInputCommandSuccessPayload) {
    return commandRanCounter.inc();
  }

  public override onLoad() {
    this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
    return super.onLoad();
  }
}
