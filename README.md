# @webreflection/bindings

A (soon to be) collection of bindings for various scenarios.

### Example

```js
import bindings from '@webreflection/bindings/message-port';

const { port1, port2 } = new MessageChannel;

// expose bindings the remote can invoke
// the `remote` itself can invoke (asynchronously)
// bindings exposed via the other port
const remote = bindings(port1, {
  log(...values) {
    console.log(...values);
  }
});

// assuming this is an iframe
parent.postMessage(null, '*', [port2]);

// later on ...
const value = await remote.doThings(1, 2, 3);
```

The remote counterpart can use or expose bindings in a similar way, this module just orchestrate a reliable way to invoke exposed APIs via `postMessage` dances.

## Currently Available

  * `@webreflection/bindings/port` to add bindings via *MessagePort* orchestration
