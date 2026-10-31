declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  export interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    scope?: string
    sw?: string
    skipWaiting?: boolean
    [key: string]: unknown
  }

  export default function withPWA(
    config: PWAConfig
  ): (nextConfig: NextConfig) => NextConfig
}
