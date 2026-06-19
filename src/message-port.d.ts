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
