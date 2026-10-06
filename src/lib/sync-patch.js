// Entity-level diff/patch for the CareShift state, shared by the browser store and the
// realtime relay. Collections are arrays of records with an `id`; updates are immutable,
// so an unchanged record keeps its reference and only touched records end up in a patch.

const isEntityArray = (value) => Array.isArray(value) && value.every((item) => item && typeof item === 'object' && 'id' in item)

export function computePatch(prev, next) {
  const patch = {}
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})])
  keys.forEach((key) => {
    const before = prev?.[key]
    const after = next?.[key]
    if (before === after) return
    if (isEntityArray(before) && isEntityArray(after)) {
      const beforeById = new Map(before.map((item) => [item.id, item]))
      const afterIds = new Set(after.map((item) => item.id))
      const upsert = after.filter((item) => beforeById.get(item.id) !== item)
      const remove = before.filter((item) => !afterIds.has(item.id)).map((item) => item.id)
      if (upsert.length || remove.length) patch[key] = { upsert, remove }
      return
    }
    patch[key] = { replace: after }
  })
  return patch
}

export function isEmptyPatch(patch) {
  return !patch || Object.keys(patch).length === 0
}

export function applyPatch(state, patch) {
  const next = { ...state }
  Object.entries(patch).forEach(([key, change]) => {
    if ('replace' in change) {
      next[key] = change.replace
      return
    }
    const current = Array.isArray(next[key]) ? next[key] : []
    const removed = new Set(change.remove || [])
    const upserts = new Map((change.upsert || []).map((item) => [item.id, item]))
    const merged = current.filter((item) => !removed.has(item.id)).map((item) => upserts.get(item.id) || item)
    const existing = new Set(merged.map((item) => item.id))
    upserts.forEach((item, id) => {
      if (!existing.has(id)) merged.push(item)
    })
    next[key] = merged
  })
  return next
}
