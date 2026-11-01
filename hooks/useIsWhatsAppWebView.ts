'use client'

import { useState, useEffect } from 'react'

/**
 * Hook personnalisé pour détecter si l'utilisateur navigue au sein de la WebView WhatsApp.
 * Les WebViews de messagerie bloquent Google OAuth (erreur 403 disallowed_useragent)
 * et nécessitent d'orienter l'utilisateur vers son navigateur externe (Chrome/Safari).
 */
export function useIsWhatsAppWebView(): boolean {
  const [isWhatsApp, setIsWhatsApp] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent
      const isWA = /WhatsApp|WhatsApp\/2/i.test(ua)
      setIsWhatsApp(isWA)
    }
  }, [])

  return isWhatsApp
}
