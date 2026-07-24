import { useEffect, useRef, useState } from 'react'

export function useElementVisibility<T extends Element>(
  rootMargin = '120px',
) {
  const elementRef = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const element = elementRef.current
    if (!element || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [rootMargin])

  return { elementRef, isVisible }
}
