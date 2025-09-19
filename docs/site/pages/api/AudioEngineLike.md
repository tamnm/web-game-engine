# AudioEngineLike

Kind: interface

## Members

- createBus — (name: string, options?: AudioBusOptions): AudioBus
- playSound — (key: string, options?: SoundOptions & { bus?: string; }): Promise<AudioHandle>
- cacheClip — (key: string, buffer: AudioBuffer): void
