import { Events, Listener, type ListenerErrorPayload } from '@sapphire/framework';

export class ListenerError extends Listener<typeof Events.ListenerError> {
  public run(_error: Error, _payload: ListenerErrorPayload) {
    return undefined;
  }
}
