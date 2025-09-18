export type EventMap = Record<string, unknown>;
export type EventKey<T extends EventMap> = Extract<keyof T, string>;
export type EventReceiver<T> = (payload: T) => void;

/**
 * Minimal event emitter with typed payloads.
 */
export class EventEmitter<T extends EventMap> {
  private listeners: Map<EventKey<T>, Set<(payload: unknown) => void>> = new Map();

  on<K extends EventKey<T>>(event: K, handler: EventReceiver<T[K]>): () => void {
    const set = this.listeners.get(event) ?? new Set<(payload: unknown) => void>();
    set.add(handler as (payload: unknown) => void);
    this.listeners.set(event, set);
    return () => this.off(event, handler);
  }

  once<K extends EventKey<T>>(event: K, handler: EventReceiver<T[K]>): () => void {
    const wrapper: EventReceiver<T[K]> = (payload) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }

  off<K extends EventKey<T>>(event: K, handler: EventReceiver<T[K]>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(handler as (payload: unknown) => void);
    if (set.size === 0) {
      this.listeners.delete(event);
    }
  }

  emit<K extends EventKey<T>>(event: K, payload: T[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of Array.from(set)) {
      (handler as EventReceiver<T[K]>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
