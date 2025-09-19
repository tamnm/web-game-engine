# EventEmitter

Kind: symbol

## Members

- listeners
- on — <K extends EventKey<T>>(event: K, handler: EventReceiver<T[K]>): () => void
- once — <K extends EventKey<T>>(event: K, handler: EventReceiver<T[K]>): () => void
- off — <K extends EventKey<T>>(event: K, handler: EventReceiver<T[K]>): void
- emit — <K extends EventKey<T>>(event: K, payload: T[K]): void
- clear — (): void
