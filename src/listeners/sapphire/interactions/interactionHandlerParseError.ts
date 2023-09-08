import { Events, type InteractionHandlerParseError, Listener } from '@sapphire/framework';

import { handleError } from '#src/util';

export class InteractionHandlerParseErrorListener extends Listener<typeof Events.InteractionHandlerParseError> {
  public run(error: Error, payload: InteractionHandlerParseError) {
    return handleError(error, payload);
  }
}
