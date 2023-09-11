import { Events, type InteractionHandlerError, Listener } from '@sapphire/framework';

import { handleError } from '#src/util';

export class InteractionHandlerErrorListener extends Listener<typeof Events.InteractionHandlerError> {
  public run(error: Error, payload: InteractionHandlerError) {
    return handleError(error, payload);
  }
}
