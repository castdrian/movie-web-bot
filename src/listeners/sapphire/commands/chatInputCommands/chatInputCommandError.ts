import { type ChatInputCommandErrorPayload, Events, Listener } from '@sapphire/framework';

import { handleError } from '#src/util';

export class ChatInputCommandError extends Listener<typeof Events.ChatInputCommandError> {
  public run(error: Error, payload: ChatInputCommandErrorPayload) {
    return handleError(error, payload);
  }
}
