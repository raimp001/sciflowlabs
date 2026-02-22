"use client"

import Link from "next/link"
import { HeaderWallet } from "@/components/header-wallet"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationBell } from "@/components/notification-bell"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function LayoutShell({ children }: { children: ReactNode }) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <>
      <AppSidebar />
      <div
        className={cn(
          "flex flex-col flex-1 w-full min-h-screen transition-[padding-left] duration-200",
          collapsed ? "pl-14" : "pl-52"
        )}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-5 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-8">
            <Link href="/">
              <span className="text-sm font-semibold tracking-tight text-foreground">SciFlow</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/for-institutions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Institutions</Link>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
              <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <HeaderWallet />
          </div>
        </header>
        <main className="flex-1 p-5 md:p-7">{children}</main>
      </div>
    </>
  )
}
