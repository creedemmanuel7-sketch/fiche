'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

interface LogoProps {
  className?: string
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <div className={`group inline-flex items-center gap-2 select-none cursor-pointer ${className}`}>
      <svg
        className="w-6 h-6 shrink-0 overflow-visible"
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
        {/* Carré vert animé (le point du "i") avec Framer Motion */}
        <motion.rect
          x="20"
          y="7"
          width="5.5"
          height="5.5"
          rx="1.5"
          fill="#108966"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformOrigin: '22.75px 9.75px' }}
        />
      </svg>
      <span className="text-xl font-bold tracking-tight text-foreground transition-colors duration-200 group-hover:text-accent">
        Fiche
      </span>
    </div>
  )
}
