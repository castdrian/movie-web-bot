import { type ChatInputCommandSuccessPayload, Events, Listener } from '@sapphire/framework';

import { commandRanCounter } from '#src/util';

export class ChatInputCommandSuccess extends Listener<typeof Events.ChatInputCommandSuccess> {
  public override run(_payload: ChatInputCommandSuccessPayload) {
    return commandRanCounter.inc();
  }
}
