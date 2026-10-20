import bindings, { options } from '../src/message-port.js';

const { port1, port2 } = new MessageChannel();

const a = bindings(port1, {
  log(...values) {
    console.log(...values);
  },
});

const b = bindings(port2, {
  sum(a, b) {
    return a + b;
  },
});

console.log(await a.sum(1, 2));

const ui8a = new Uint8Array([123]);

await b[options]({ transfer: [ui8a.buffer] }).log(ui8a);

new Worker('./worker.js', { type: 'module' }).postMessage(null, [port2]);
