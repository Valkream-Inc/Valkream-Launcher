/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Client HTTP unique du main : `fetch` natif (Node / Electron) avec délai maximal,
 * annulation et en-têtes anti-cache. Remplace axios.
 */

import type { NoCacheConfig } from "../types/core";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`HTTP ${status} pour ${url}`);
    this.name = "HttpError";
  }
}

export interface HttpGetOptions {
  /** Délai maximal pour recevoir les en-têtes de la réponse (ms). */
  timeout?: number;
  headers?: Record<string, string>;
  /** Ajoute les en-têtes et le paramètre `_t` qui désactivent tout cache. */
  noCache?: NoCacheConfig;
  signal?: AbortSignal;
  /** Statuts acceptés (défaut : 2xx). */
  accept?: (status: number) => boolean;
}

const withParams = (url: string, params: Record<string, string | number>): string => {
  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) target.searchParams.set(key, String(value));
  return target.toString();
};

/** GET qui rejette en `HttpError` si le statut n'est pas accepté, et en erreur réseau sinon. */
export const httpGet = async (url: string, options: HttpGetOptions = {}): Promise<Response> => {
  const { timeout = 5000, headers = {}, noCache, signal, accept = (status) => status >= 200 && status < 300 } = options;

  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason);
  if (signal?.aborted) onAbort();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(
    () => controller.abort(Object.assign(new Error(`Délai dépassé (${timeout} ms) pour ${url}`), { code: "ETIMEDOUT" })),
    timeout,
  );

  try {
    const response = await fetch(noCache ? withParams(url, noCache.params) : url, {
      method: "GET",
      headers: { ...(noCache?.headers ?? {}), ...headers },
      signal: controller.signal,
    });
    if (!accept(response.status)) {
      void response.body?.cancel();
      throw new HttpError(response.status, url);
    }
    return response;
  } catch (error) {
    // Délai dépassé : on remonte l'erreur lisible plutôt qu'un AbortError générique
    if (controller.signal.aborted && !signal?.aborted && controller.signal.reason instanceof Error) {
      throw controller.signal.reason;
    }
    throw error;
  } finally {
    clearTimeout(timer); // seul l'arrivée des en-têtes est chronométrée ; le corps a son propre garde-fou
    signal?.removeEventListener("abort", onAbort);
  }
};

export const httpGetText = async (url: string, options?: HttpGetOptions): Promise<string> =>
  (await httpGet(url, options)).text();
