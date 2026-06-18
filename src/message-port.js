import nextResolver from 'next-resolver';
import { nil } from '@webreflection/utils/empty';

const [next, resolve] = nextResolver();

/**
 * Creates a proxy that can be used to call methods remotely via the port.
 * @param {MessagePort} port - The port to use for communication.
 * @param {Record<string, (...args: any[]) => Promise<any>>} bindings - The bindings to use for the methods.
 * @returns {Record<string, (...args: any[]) => Promise<any>>}
 */
export default (port, bindings) => {
  port.onmessage = async ({ data: [exec, id, name, args] }) => {
    if (exec) {
      try { port.postMessage([!exec, id, await bindings[name](...args), null]) }
      catch (error) { port.postMessage([!exec, id, null, error]) }
    }
    else resolve(id, name, args);
  };
  return new Proxy(nil, {
    get(_, name) {
      return (...args) => {
        const [id, promise] = next();
        port.postMessage([true, id, name, args]);
        return promise;
      };
    }
  });
};
