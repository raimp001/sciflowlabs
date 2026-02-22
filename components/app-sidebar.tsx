"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  FileText,
  FlaskConical,
  CircleDollarSign,
  Wallet,
  Settings,
  Scale,
  Sparkles,
  Shield,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navItems = [
  { title: "Dashboard",      url: "/dashboard",               icon: Home },
  { title: "My Bounties",    url: "/dashboard/bounties",      icon: FileText },
  { title: "Open Bounties",  url: "/dashboard/open-bounties", icon: CircleDollarSign },
  { title: "Labs",           url: "/dashboard/labs",          icon: FlaskConical },
  { title: "Proposals",      url: "/dashboard/proposals",     icon: FileText },
  { title: "Escrow",         url: "/dashboard/escrow",        icon: Wallet },
  { title: "Disputes",       url: "/dashboard/disputes",      icon: Scale },
  { title: "Agent",          url: "/dashboard/agent",         icon: Sparkles },
]

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  const { dbUser } = useAuth()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Logo / header */}
      <div className="flex items-center h-14 border-b border-sidebar-border px-3 shrink-0">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2.5 w-full text-left group"
          title="Toggle sidebar"
        >
          {/* Simple square logo mark */}
          <div className="w-7 h-7 rounded-md bg-accent/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent">S</span>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
              SciFlow
            </span>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            item.url === "/dashboard"
              ? pathname === item.url
              : pathname.startsWith(item.url)

          return (
            <Link
              key={item.url}
              href={item.url}
              title={collapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-0.5">
        {bottomItems.map((item) => {
          const isActive = pathname === item.url
          return (
            <Link
              key={item.url}
              href={item.url}
              title={collapsed ? item.title : undefined}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}

        {/* Admin link — only for admins */}
        {dbUser?.role === 'admin' && (
          <Link
            href="/admin"
            title={collapsed ? 'Admin Review' : undefined}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
              pathname.startsWith('/admin')
                ? "bg-amber-500/20 text-amber-300 font-medium"
                : "text-amber-400/70 hover:text-amber-300 hover:bg-sidebar-accent/50"
            )}
          >
            <Shield className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Admin Queue</span>}
          </Link>
        )}

        {/* Wallet */}
        {!collapsed && <ConnectWalletButton variant="sidebar" />}
      </div>
    </aside>
  )
}
