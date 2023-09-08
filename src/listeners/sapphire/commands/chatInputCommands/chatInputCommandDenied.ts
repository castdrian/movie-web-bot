import { type ChatInputCommandDeniedPayload, Events, Listener, type UserError } from '@sapphire/framework';

import { handleError } from '#src/util';

export class ChatInputCommandDenied extends Listener<typeof Events.ChatInputCommandDenied> {
  public run(error: UserError, payload: ChatInputCommandDeniedPayload) {
    return handleError(error, payload);
  }
}
