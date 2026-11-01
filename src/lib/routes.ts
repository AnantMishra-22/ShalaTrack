export function go(path: string, parameters: Record<string, string> = {}) {
  const query = new URLSearchParams(parameters).toString();
  window.location.hash = `/${path}${query ? `?${query}` : ''}`;
}
export function parameter(name: string) { return new URLSearchParams(window.location.hash.split('?')[1] || window.location.search).get(name) || ''; }
