export type UpstreamResult<T> = { status: 'ok'; data: T } | { status: 'unavailable' };

/**
 * MSCA-D's cross-benefit overview composes three independently-deployed
 * services over real HTTP, not by importing another domain's in-memory
 * state -- that's what actually makes the independence claim true (see
 * CLAUDE.md's "Backends: BFF pattern" section). Each call is wrapped so a
 * slow/failed upstream degrades only its own tile, never the whole
 * response: a timeout, a network error, or a non-2xx all resolve to
 * `{ status: 'unavailable' }` instead of rejecting.
 */
export async function fetchJson<T>(url: string, timeoutMs = 2000): Promise<UpstreamResult<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return { status: 'unavailable' };
    }
    return { status: 'ok', data: (await response.json()) as T };
  } catch {
    return { status: 'unavailable' };
  } finally {
    clearTimeout(timeout);
  }
}
