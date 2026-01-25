"use client"

import { cn } from "@/lib/utils"

interface SciFlowLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function SciFlowLogo({ 
  size = "md", 
  showText = true,
  className 
}: SciFlowLogoProps) {
  const iconSize = size === "sm" ? "w-6 h-6" : size === "md" ? "w-8 h-8" : "w-10 h-10"
  const textSize = size === "sm" ? "text-base" : size === "md" ? "text-lg" : "text-xl"
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "flex items-center justify-center rounded-lg bg-slate-900",
        iconSize
      )}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className={size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"}
        >
          <path 
            d="M9 3V11L5 19C4.5 20 5 21 6 21H18C19 21 19.5 20 19 19L15 11V3" 
            stroke="url(#grad)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          <path d="M9 3H15" stroke="url(#grad)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="11" cy="15" r="1" fill="#34D399" />
          <circle cx="14" cy="16" r="0.8" fill="#6EE7B7" />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <span className={cn("font-semibold text-slate-100", textSize)}>
          Sci<span className="text-amber-400">Flow</span>
        </span>
      )}
    </div>
  )
}
