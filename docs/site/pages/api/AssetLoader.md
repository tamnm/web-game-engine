# AssetLoader

Kind: type

## Definition

```ts
export type AssetLoader<T, Source = string> = (
  source: Source,
  ctx: AssetRequestContext
) => Promise<T>;
```
