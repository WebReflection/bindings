/** `postMessage` options for the next binding response (`transfer`, etc.). */
export type PostMessageOptions = StructuredSerializeOptions;

/**
 * The only symbol exported by this module.
 *
 * {@link bindings} installs a setter-only `this[options]` accessor on the
 * `local` object. Assign {@link PostMessageOptions} from local handlers;
 * the value is not readable, is consumed on the next response, then cleared
 * (including after errors).
 */
export declare const options: unique symbol;

/**
 * `local` object passed to {@link bindings}, after which handlers can assign
 * `this[options]`. TypeScript has no write-only property type — reading
 * `this[options]` is unsupported at runtime.
 */
export type LocalOptionsHost = {
  [options]: PostMessageOptions;
};

/** Any function exposed as a local binding (sync or async). */
export type Handler = (...args: any[]) => any;

/** Map of method names to handlers exposed on this side of the port. */
export type LocalBindings = Record<string, Handler>;

/**
 * Proxy for methods exposed on the remote side.
 * Every remote call is asynchronous, even when the remote handler is sync.
 */
export type RemoteProxy<T extends LocalBindings = LocalBindings> = {
  [K in keyof T]: (...args: Parameters<T[K]>) => Promise<Awaited<ReturnType<T[K]>>>;
};

declare function bindings<
  Local extends LocalBindings,
  Remote extends LocalBindings = LocalBindings,
>(
  port: MessagePort,
  local: Local,
): RemoteProxy<Remote>;

export default bindings;
