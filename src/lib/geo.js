// Best-effort current position for SOS events; resolves null after 3s or on denial so
// callers can record the alert first and attach the location when it arrives.
export function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    const timer = setTimeout(() => resolve(null), 3000)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        clearTimeout(timer)
        resolve(null)
      },
      { timeout: 3000 },
    )
  })
}
