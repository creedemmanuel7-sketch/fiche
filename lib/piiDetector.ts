/**
 * Moteur de détection de données sensibles (PII & secrets d'API) côté client (Local-First).
 * Conforme aux directives IPDCP et de sécurité applicative.
 */

export type SensitiveType = 'api_key' | 'phone' | 'email'

export interface SensitiveItem {
  type: SensitiveType
  label: string
  maskedPlaceholder: string
  rawMatch: string
  startIndex: number
  endIndex: number
}

export interface DetectionResult {
  hasSensitiveData: boolean
  totalCount: number
  types: SensitiveType[]
  typeLabels: string[]
  items: SensitiveItem[]
}

// Regex pour clés d'API et secrets
const API_KEY_PATTERNS = [
  /sk_live_[a-zA-Z0-9_-]+/gi,
  /sk_test_[a-zA-Z0-9_-]+/gi,
  /notify_token(?:[=:\s]+[a-zA-Z0-9_.-]+)?/gi,
  /X-FEDAPAY-SIGNATURE(?:[=:\s]+[a-zA-Z0-9_.-]+)?/gi,
  /(?:api[_-]?key|secret[_-]?key|access[_-]?token|bearer\s+token)[\s:=]+['"][a-zA-Z0-9_\-.]{8,}['"]/gi,
]

// Regex pour numéros de téléphone (Togo +228, format local 8 chiffres, international standard)
const PHONE_PATTERNS = [
  // Format togolais avec indicatif : +228 90 00 00 00 ou 00228 90000000
  /(?:\+228|00228)[\s.-]?(?:9[0-9]|7[0-9]|2[2-7])(?:[\s.-]?[0-9]{2}){3}/g,
  // Format togolais local 8 chiffres commençant par 9, 7 ou 2 : ex: 90 00 00 00 ou 90000000
  /\b(?:9[0-9]|7[0-9]|2[2-7])[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}[\s.-]?[0-9]{2}\b/g,
  // Format international générique avec indicatif : ex: +33 6 12 34 56 78
  /\+(?:[0-9]{1,3})[\s.-]?(?:\(?[0-9]{1,4}\)?[\s.-]?){2,4}[0-9]{2,4}/g,
]

// Regex pour emails
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

/**
 * Analyse un texte brut pour détecter d'éventuelles données personnelles ou secrètes.
 */
export function detectSensitiveData(text: string): DetectionResult {
  if (!text || !text.trim()) {
    return {
      hasSensitiveData: false,
      totalCount: 0,
      types: [],
      typeLabels: [],
      items: [],
    }
  }

  const rawCandidates: SensitiveItem[] = []

  // Helper pour trouver toutes les correspondances avec index
  const collectMatches = (
    regexes: RegExp[],
    type: SensitiveType,
    label: string,
    placeholder: string,
    minDigits = 0
  ) => {
    for (const pattern of regexes) {
      // Cloner la regex avec le drapeau global
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
      let match: RegExpExecArray | null
      while ((match = re.exec(text)) !== null) {
        const rawMatch = match[0].trim()
        if (minDigits > 0) {
          const digits = rawMatch.replace(/\D/g, '')
          if (digits.length < minDigits) continue
        }
        rawCandidates.push({
          type,
          label,
          maskedPlaceholder: placeholder,
          rawMatch,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    }
  }

  // 1. Clés d'API
  collectMatches(API_KEY_PATTERNS, 'api_key', 'Clé API', '[SECRET_API_MASQUÉ]')

  // 2. Numéros de téléphone
  collectMatches(PHONE_PATTERNS, 'phone', 'Numéro', '[TÉLÉPHONE_MASQUÉ]', 8)

  // 3. Emails
  collectMatches([EMAIL_PATTERN], 'email', 'Email', '[EMAIL_MASQUÉ]')

  // Trier par position de départ, puis par longueur décroissante
  rawCandidates.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex
    }
    return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex)
  })

  // Éliminer les chevauchements (conserver la correspondance la plus longue / prioritaire)
  const items: SensitiveItem[] = []
  let lastEnd = -1

  for (const candidate of rawCandidates) {
    if (candidate.startIndex >= lastEnd) {
      items.push(candidate)
      lastEnd = candidate.endIndex
    }
  }

  const uniqueTypes = Array.from(new Set(items.map((i) => i.type)))
  const typeLabelsMap: Record<SensitiveType, string> = {
    api_key: 'Clé API',
    phone: 'Numéro',
    email: 'Email',
  }
  const typeLabels = uniqueTypes.map((t) => typeLabelsMap[t])

  return {
    hasSensitiveData: items.length > 0,
    totalCount: items.length,
    types: uniqueTypes,
    typeLabels,
    items,
  }
}
