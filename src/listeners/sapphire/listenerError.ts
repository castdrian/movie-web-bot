import { Events, Listener, type ListenerErrorPayload } from '@sapphire/framework';

import { handleError } from '#src/util';

export class ListenerError extends Listener<typeof Events.ListenerError> {
  public run(error: Error, payload: ListenerErrorPayload) {
    return handleError(error, payload);
  }
}
