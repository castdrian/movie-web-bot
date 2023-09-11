import { type ContextMenuCommandErrorPayload, Events, Listener } from '@sapphire/framework';

import { handleError } from '#src/util';

export class ContextMenuCommandError extends Listener<typeof Events.ContextMenuCommandError> {
  public run(error: Error, payload: ContextMenuCommandErrorPayload) {
    return handleError(error, payload);
  }
}
