type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue }

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

function canUseRedis() {
  return Boolean(redisUrl && redisToken)
}

async function redisRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!canUseRedis()) return null
  try {
    const res = await fetch(`${redisUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    })
    if (!res.ok) return null
    const json = (await res.json()) as { result?: T }
    return (json.result ?? null) as T | null
  } catch {
    return null
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const raw = await redisRequest<string>(`/get/${encodeURIComponent(key)}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function redisSetJson(key: string, value: JsonValue, ttlSeconds: number): Promise<void> {
  const payload = JSON.stringify(value)
  await redisRequest(`/set/${encodeURIComponent(key)}`, {
    method: "POST",
    body: JSON.stringify({ value: payload, ex: ttlSeconds }),
  })
}

export async function redisDel(keys: string | string[]): Promise<void> {
  const all = Array.isArray(keys) ? keys : [keys]
  if (!all.length) return
  await Promise.all(all.map((k) => redisRequest(`/del/${encodeURIComponent(k)}`, { method: "POST" })))
}

export function withRedisKeyPrefix(prefix: string, key: string) {
  return `${prefix}:${key}`
}

