# AssetManager

Kind: symbol

## Members

- cache
- loaders
- eventsEmitter
- (anonymous)
- events
- registerLoader — (registration: AssetLoaderRegistration<unknown>): void
- load — <T>(descriptor: AssetDescriptor<T>, options?: LoadOptions): Promise<T>
- load — <T>(descriptor: AssetDescriptor<T>, options?: LoadOptions): Promise<T>
- load — <T>(descriptor: AssetDescriptor<T>, options?: LoadOptions): Promise<T>
- get — <T = unknown>(key: string): T
- release — (key: string): void
- warm — (descriptors: AssetDescriptor<unknown>[]): void
- loadSingle — <T>(descriptor: AssetDescriptor<T>): Promise<T>
- resolveLoader — <T>(descriptor: AssetDescriptor<T>): AssetLoader<T>
