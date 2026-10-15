import { createContext, useContext, useEffect } from 'react'

// Detail pages add their own trailing breadcrumbs ("Ca chăm sóc mới › Yêu cầu #cr-1") through this hook.
// Each item is { label, to? }; the last item is the current page and is not a link.
export const CrumbContext = createContext(() => {})

export function usePageCrumbs(trail) {
  const setTrail = useContext(CrumbContext)
  const key = JSON.stringify(trail || [])
  useEffect(() => {
    setTrail(JSON.parse(key))
    return () => setTrail([])
  }, [key, setTrail])
}
