# InputManager

Kind: symbol

## Members

- bindings
- states
- storage
- events
- (anonymous)
- getBindings — (action: string): InternalBinding[]
- bind — (action: string, binding: ActionBinding): void
- rebind — (action: string, bindings: ActionBinding[]): void
- removeBinding — (action: string, predicate: (binding: ActionBinding) => boolean): void
- handleKey — (code: string, isDown: boolean, timestamp?: number): void
- handleGamepadButton — (code: string, isDown: boolean, timestamp?: number): void
- handleAction — (action: string, isDown: boolean, value?: number, timestamp?: number): void
- processInput — (device: InputDevice, code: string, isDown: boolean, timestamp: number): void
- getOrCreateState — (action: string): ActionState
- emitState — (action: string, state: ActionState, isDown: boolean): void
- persist — (): void
