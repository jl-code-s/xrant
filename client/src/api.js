const BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  return res;
}

export function apiUrl(path) {
  return `${BASE}${path}`;
}
