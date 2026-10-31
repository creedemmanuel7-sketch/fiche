import * as React from 'react'

interface LogoProps {
  className?: string
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        className="w-6 h-6 shrink-0"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="currentColor" className="text-foreground" />
        <text
          x="7"
          y="24"
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontSize="22"
          fontWeight="800"
          fill="var(--background)"
        >
          F
        </text>
        <rect x="20" y="7" width="5.5" height="5.5" rx="1.5" fill="#108966" />
      </svg>
      <span className="text-xl font-bold tracking-tight text-foreground">
        Fiche
      </span>
    </div>
  )
}
