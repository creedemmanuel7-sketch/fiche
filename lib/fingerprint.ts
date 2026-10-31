const STORAGE_KEY = 'fiche_viewer_fingerprint'

export function getFingerprint(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    let fp = localStorage.getItem(STORAGE_KEY)
    if (!fp) {
      fp =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : 'fp_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
      localStorage.setItem(STORAGE_KEY, fp)
    }
    return fp
  } catch {
    return 'fallback_fp_' + Date.now()
  }
}
