import { MessageChannel } from 'node:worker_threads';
import bindings, { options } from '../src/message-port.js';

const { port1, port2 } = new MessageChannel();
let failOnce = true;

bindings(port1, {
  readBuffer() {
    const i32a = new Int32Array([1, 2, 3]);
    this[options] = { transfer: [i32a.buffer] };
    return i32a;
  },
  ping(value) {
    return value * 2;
  },
  failWithOptions() {
    this[options] = { transfer: [new ArrayBuffer(8)] };
    if (failOnce) {
      failOnce = false;
      throw new Error('fail');
    }
    return 'ok';
  },
});

const remote = bindings(port2, {});

await remote.failWithOptions().catch((error) => {
  if (error.message !== 'fail') throw error;
});

if (await remote.failWithOptions() !== 'ok') {
  throw new Error('expected success after error path cleared opts');
}

const i32a = await remote.readBuffer();

if (!(i32a instanceof Int32Array)) throw new Error('expected Int32Array');
if (i32a[0] !== 1 || i32a[1] !== 2 || i32a[2] !== 3) {
  throw new Error('unexpected buffer contents');
}

if (await remote.ping(21) !== 42) throw new Error('expected ping to return 42');

console.log('runtime ok');

port1.close();
port2.close();
