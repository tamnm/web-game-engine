# EventKey

Kind: type

## Definition

```ts
export type EventKey<T extends EventMap> = Extract<keyof T, string>;
```
