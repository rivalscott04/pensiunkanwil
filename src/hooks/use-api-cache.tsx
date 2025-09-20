import { useState, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
}

export function useApiCache<T = any>(options: CacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 50 } = options // Default 5 minutes TTL
  const [cache] = useState(() => new Map<string, CacheEntry<T>>())
  const cacheRef = useRef(cache)

  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now > entry.expiresAt) {
      cacheRef.current.delete(key)
      return null
    }

    return entry.data
  }, [])

  const set = useCallback((key: string, data: T): void => {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    }

    // Remove oldest entries if cache is full
    if (cacheRef.current.size >= maxSize) {
      const oldestKey = cacheRef.current.keys().next().value
      cacheRef.current.delete(oldestKey)
    }

    cacheRef.current.set(key, entry)
  }, [ttl, maxSize])

  const invalidate = useCallback((key: string): void => {
    cacheRef.current.delete(key)
  }, [])

  const clear = useCallback((): void => {
    cacheRef.current.clear()
  }, [])

  const generateKey = useCallback((prefix: string, params: Record<string, any> = {}): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&')
    
    return sortedParams ? `${prefix}?${sortedParams}` : prefix
  }, [])

  return {
    get,
    set,
    invalidate,
    clear,
    generateKey,
    size: cacheRef.current.size
  }
}
