import { useEffect, useState } from 'react'

/**
 * Mirrors a fast-changing value but only after it has held steady for `delay`
 * milliseconds, so keystroke-driven queries fire once the user pauses.
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
