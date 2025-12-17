const BASE_URL = "https://api.rawg.io/api";
const KEY = process.env.EXPO_PUBLIC_RAWG_API_KEY;

if (!KEY) {
  console.warn("Missing EXPO_PUBLIC_RAWG_API_KEY in .env");
}

type Query = Record<string, string | number | undefined>;

const toQueryString = (q: Query) =>
  Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

export async function rawgGet<T>(path: string, query: Query = {}): Promise<T> {
  const qs = toQueryString({ key: KEY ?? "", ...query });
  const url = `${BASE_URL}${path}?${qs}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RAWG error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}