//@ts-check

import nextResolver from 'next-resolver';
import Map from '@webreflection/utils/map';
import { nil } from '@webreflection/utils/empty';

const { defineProperty } = Object;
const [next, resolve] = nextResolver();

/**
 * @typedef {StructuredSerializeOptions} PostMessageOptions
 */

/**
 * The only symbol exported by this module.
 *
 * {@link bindings} installs a setter-only `this[options]` accessor on the
 * `local` object. Assign {@link PostMessageOptions} from local handlers
 * before returning (e.g. `{ transfer: [...] }`). The value cannot be read
 * back; it is consumed with the next response `postMessage`, then cleared
 * (including after errors).
 *
 * @type {unique symbol}
 */
export const options = Symbol();

/**
 * Creates a proxy for calling methods exposed on the remote side of the port,
 * while dispatching incoming calls to `local` on this side.
 *
 * `local` is inferred from the second argument. The remote API is never known
 * from that object alone: pass a second generic or assert the return type
 * (see README).
 *
 * Also installs a setter-only `this[options]` accessor on `local` so handlers
 * can assign {@link PostMessageOptions} for their response.
 *
 * @template {import('./message-port.js').LocalBindings} Local
 * @template {import('./message-port.js').LocalBindings} Remote
 * @param {MessagePort} port
 * @param {Local} local Methods exposed to the remote side (sync or async).
 * @returns {import('./message-port.js').RemoteProxy<Remote>}
 */
const bindings = (port, local) => {
  // secure the postMessage method to avoid potential
  // MessagePort.prototype.postMessage overrides interfering
  // with the communication channel
  const post = port.postMessage.bind(port), $ = new Map;

  let opts = nil;

  defineProperty(local, options, {
    configurable: false,
    set(value) { opts = value },
  });

  port.onmessage = async ({ data: [exec, id, name, args] }) => {
    if (exec) {
      try {
        const result = await local[name](...args);
        post([!exec, id, result, null], opts);
      }
      catch (error) { post([!exec, id, null, error]) }
      finally { opts = nil }
    }
    else resolve(id, name, args);
  };

  return /** @type {import('./message-port.js').RemoteProxy<Remote>} */(new Proxy(nil, {
    get: (_, name) => $.get(name) ?? $.put(name, (/** @type {any[]} */ ...args) => {
      const [id, promise] = next();
      post([true, id, name, args]);
      return promise;
    }),
  }));
};

export default bindings;
