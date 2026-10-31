import * as React from 'react'

interface LogoProps {
  className?: string
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <span
      className={`inline-flex items-baseline text-xl font-bold tracking-tight text-foreground select-none ${className}`}
    >
      F
      <span className="relative inline-block">
        <span
          className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-accent rounded-[1px]"
          aria-hidden="true"
        />
        <span>ı</span>
      </span>
      che
    </span>
  )
}
