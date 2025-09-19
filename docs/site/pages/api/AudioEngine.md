# AudioEngine

Kind: symbol

## Members

- context
- master
- busses
- clips
- (anonymous)
- audioContext
- createBus — (name: string, options?: AudioBusOptions): AudioBus
- setMasterVolume — (volume: number): void
- cacheClip — (key: string, buffer: AudioBuffer): void
- getClip — (key: string): AudioClip
- decodeAudioData — (arrayBuffer: ArrayBuffer): Promise<AudioBuffer>
- playSound — (key: string, options?: SoundOptions & { bus?: string; }): Promise<AudioHandle>
