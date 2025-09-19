# AssetLoaderRegistration

Kind: interface

## Members

- id
- match — (descriptor: AssetDescriptor<unknown>): boolean
- loader — (source: string, ctx: AssetRequestContext): Promise<T>
