# @webreflection/bindings

A (soon to be) collection of bindings for various scenarios.

### Example

```js
import bindings from '@webreflection/bindings/message-port';

/** @typedef {import('@webreflection/bindings/message-port').RemoteProxy} RemoteProxy */

const { port1, port2 } = new MessageChannel();

// `local` is inferred from the object below.
// `remote` calls methods exposed on the other side of the port — declare that
// shape explicitly; it cannot be inferred from `local`.
/** @type {RemoteProxy<{ sum: (a: number, b: number) => number }>} */
const remote = bindings(port1, {
  log(...values) {
    console.log(...values);
  },
});

// assuming this is an iframe
parent.postMessage(null, '*', [port2]);

// later on ...
const value = await remote.sum(1, 2);
```

Each side calls `bindings(port, local)` with its own port and local handlers. The returned proxy always targets the *other* side's `local` object. This module only orchestrates the `postMessage` protocol.

#### Typing

| What | Known at call site? |
| --- | --- |
| Second argument (`local`) | yes — inferred from the object you pass |
| Return value (remote proxy) | no — depends on the other context (worker, iframe, another window) |

Without an explicit remote type, TypeScript falls back to a loose string-keyed proxy (`RemoteProxy` defaults to `Record<string, Handler>`). For a known remote API, pick one of:

```js
// assertion (JavaScript / checkJs)
const remote = /** @type {RemoteProxy<{ sum: (a: number, b: number) => number }>} */ (
  bindings(port1, { log() {} })
);
```

```ts
// generic parameter (TypeScript)
import bindings, { type RemoteProxy } from '@webreflection/bindings/message-port';

type MainAPI = { log: (...values: unknown[]) => void };
type WorkerAPI = { sum: (a: number, b: number) => number };

const worker = bindings<MainAPI, WorkerAPI>(port1, {
  log(...values) {
    console.log(...values);
  },
});

await worker.sum(1, 2);
```

Remote methods always return a `Promise`, even when the handler on the other side is synchronous.

## Currently Available

  * `@webreflection/bindings/message-port` — bind APIs over a *MessagePort* (workers, iframes, `MessageChannel`, etc.)
