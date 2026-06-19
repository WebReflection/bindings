//@ts-check

import nextResolver from 'next-resolver';
import { nil } from '@webreflection/utils/empty';

const [next, resolve] = nextResolver();

/**
 * Creates a proxy for calling methods exposed on the remote side of the port,
 * while dispatching incoming calls to `local` on this side.
 *
 * `local` is inferred from the second argument. The remote API is never known
 * from that object alone: pass a second generic or assert the return type
 * (see README).
 *
 * @template {import('./message-port.js').LocalBindings} Local
 * @template {import('./message-port.js').LocalBindings} Remote
 * @param {MessagePort} port
 * @param {Local} local Methods exposed to the remote side (sync or async).
 * @returns {import('./message-port.js').RemoteProxy<Remote>}
 */
export default (port, local) => {
  // secure the postMessage method to avoid potential
  // MessagePort.prototype.postMessage overrides interfering
  // with the communication channel
  const post = port.postMessage.bind(port);
  port.onmessage = async ({ data: [exec, id, name, args] }) => {
    if (exec) {
      try { post([!exec, id, await local[name](...args), null]) }
      catch (error) { post([!exec, id, null, error]) }
    }
    else resolve(id, name, args);
  };
  return /** @type {import('./message-port.js').RemoteProxy<Remote>} */(new Proxy(nil, {
    get(_, name) {
      return (/** @type {any[]} */ ...args) => {
        const [id, promise] = next();
        post([true, id, name, args]);
        return promise;
      };
    }
  }));
};
