import { apiListUsers, apiMe } from './api'

// Simple in-memory cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

function getCacheKey(prefix: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return sortedParams ? `${prefix}?${sortedParams}` : prefix
}

function getFromCache(key: string): any | null {
  const entry = cache.get(key)
  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return entry.data
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  })
}

export async function apiListUsersCached(params: { search?: string; role?: string; perPage?: number; page?: number }): Promise<{ items: any[]; meta?: any }> {
  const cacheKey = getCacheKey('users', params)
  
  // Try to get from cache first
  const cached = getFromCache(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch from API and cache the result
  const result = await apiListUsers(params)
  setCache(cacheKey, result)
  
  return result
}

export async function apiMeCached(): Promise<{ user: any; impersonation?: any }> {
  const cacheKey = 'me'
  
  // Try to get from cache first
  const cached = getFromCache(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch from API and cache the result
  const result = await apiMe()
  setCache(cacheKey, result)
  
  return result
}

export function clearApiCache(): void {
  cache.clear()
}

export function invalidateCache(pattern?: string): void {
  if (pattern) {
    // Remove cache entries that match the pattern
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}
