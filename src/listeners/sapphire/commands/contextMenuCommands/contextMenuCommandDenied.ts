import { type ContextMenuCommandDeniedPayload, Events, Listener, type UserError } from '@sapphire/framework';

import { handleError } from '#src/util';

export class ContextMenuCommandDenied extends Listener<typeof Events.ContextMenuCommandDenied> {
  public run(error: UserError, payload: ContextMenuCommandDeniedPayload) {
    return handleError(error, payload);
  }
}
