# @webreflection/bindings

[![Coverage Status](https://coveralls.io/repos/github/WebReflection/bindings/badge.svg?branch=main)](https://coveralls.io/github/WebReflection/bindings?branch=main)

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

#### Transferable responses

Import `options` and assign `this[options]` inside a local handler to pass
`postMessage` options (typically `{ transfer: [...] }`) with the response.
`options` is the only symbol used by this module. `bindings()` installs a
setter-only accessor on the `local` object — assign before returning; it
cannot be read back. Use method syntax (not arrow functions) so `this` refers
to `local`:

```js
import bindings, { options } from '@webreflection/bindings/message-port';

/** @typedef {import('@webreflection/bindings/message-port').RemoteProxy} RemoteProxy */
/** @typedef {import('@webreflection/bindings/message-port').LocalOptionsHost} LocalOptionsHost */

const { port1, port2 } = new MessageChannel();

// this side exposes `readBuffer` to the other side
bindings(port1, {
  /** @this {LocalOptionsHost} */
  readBuffer() {
    const i32a = new Int32Array([1, 2, 3]);
    this[options] = { transfer: [i32a.buffer] };
    return i32a;
  },
});

// other side calls it through the returned proxy
/** @type {RemoteProxy<{ readBuffer: () => Int32Array }>} */
const remote = bindings(port2, {});

const i32a = await remote.readBuffer();
```

```ts
import bindings, {
  options,
  type LocalOptionsHost,
  type RemoteProxy,
} from '@webreflection/bindings/message-port';

const { port1, port2 } = new MessageChannel();

type WorkerAPI = { readBuffer: () => Int32Array<ArrayBuffer> };

bindings(port1, {
  readBuffer(this: LocalOptionsHost) {
    const i32a = new Int32Array([1, 2, 3]);
    this[options] = { transfer: [i32a.buffer] };
    return i32a;
  },
});

const worker = bindings<Record<string, never>, WorkerAPI>(port2, {});
await worker.readBuffer();
```

There is a single `opts` slot per `bindings()` call. Treat `this[options]` as an
advanced feature: assign it right before returning, when something must be
transferred, and only if you understand concurrent handlers on the same port
can overwrite each other's options while they are in flight.

On failure, any options set during that handler are discarded (`finally` clears
the slot) and the error reply is sent without them.

## Currently Available

  * `@webreflection/bindings/message-port` — bind APIs over a *MessagePort* (workers, iframes, `MessageChannel`, etc.)
