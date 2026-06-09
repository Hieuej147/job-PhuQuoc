import type { EventName, EventData } from './events.types';

export interface TypedInngestEvent<T extends EventName = EventName> {
  name: T;
  data: EventData<T>;
}

export interface InngestStepTools {
  run: <R>(id: string, fn: () => Promise<R>) => Promise<R>;
  sendEvent: (id: string, event: { name: string; data: Record<string, unknown>; ts?: number }) => Promise<void>;
  sleep: (id: string, duration: string) => Promise<void>;
  waitForEvent: (id: string, opts: { event: string; timeout: string }) => Promise<unknown>;
}

export interface TypedInngestContext<T extends EventName = EventName> {
  event: TypedInngestEvent<T>;
  step: InngestStepTools;
}

export interface CronInngestContext {
  step: InngestStepTools;
}
