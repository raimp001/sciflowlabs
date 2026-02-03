"use client"

import { cn } from "@/lib/utils"

interface SciFlowLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function SciFlowLogo({
  size = "md",
  showText = true,
  className
}: SciFlowLogoProps) {
  // More generous sizing for better visibility
  const sizeConfig = {
    sm: { icon: "w-6 h-6", text: "text-sm", gap: "gap-2" },
    md: { icon: "w-7 h-7", text: "text-base", gap: "gap-2.5" },
    lg: { icon: "w-9 h-9", text: "text-xl", gap: "gap-3" },
    xl: { icon: "w-11 h-11", text: "text-2xl", gap: "gap-3.5" },
  }

  const config = sizeConfig[size]

  // Warm terracotta/orange accent color - refined
  const accentColor = "hsl(20, 70%, 55%)"
  const accentColorLight = "hsl(20, 70%, 68%)"

  return (
    <div className={cn("flex items-center", config.gap, className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className={cn(config.icon, "flex-shrink-0")}
      >
        {/* Flask outline - slightly thicker stroke for better visibility */}
        <path
          d="M9 3V11L5 19C4.5 20 5 21 6 21H18C19 21 19.5 20 19 19L15 11V3"
          stroke={accentColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Flask top */}
        <path
          d="M9 3H15"
          stroke={accentColor}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        {/* Bubbles - better positioned */}
        <circle cx="10.5" cy="15" r="1.4" fill={accentColor} />
        <circle cx="14" cy="16.5" r="1" fill={accentColorLight} />
        <circle cx="12" cy="18" r="0.7" fill={accentColorLight} opacity="0.7" />
      </svg>
      {showText && (
        <span className={cn("font-semibold tracking-tight text-foreground", config.text)}>
          SciFlow
        </span>
      )}
    </div>
  )
}
