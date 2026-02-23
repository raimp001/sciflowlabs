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
  Search,
  Send,
  CheckSquare,
  DollarSign,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// ── Funder nav — funds research ──────────────────────────────────
const funderNav = [
  { title: "Home",              url: "/dashboard",               icon: Home },
  { title: "Fund Research",     url: "/dashboard/bounties/new",  icon: DollarSign,    action: true },
  { title: "My Projects",       url: "/dashboard/bounties",      icon: FileText },
  { title: "Find Labs",         url: "/dashboard/labs",          icon: FlaskConical },
  { title: "Payments & Escrow", url: "/dashboard/escrow",        icon: Wallet },
  { title: "AI Assistant",      url: "/dashboard/agent",         icon: Sparkles },
]

// ── Lab nav — does the research ──────────────────────────────────
const labNav = [
  { title: "Home",            url: "/dashboard",               icon: Home },
  { title: "Find Projects",   url: "/dashboard/open-bounties", icon: Search },
  { title: "My Applications", url: "/dashboard/proposals",     icon: Send },
  { title: "Active Work",     url: "/dashboard/research",      icon: CheckSquare },
  { title: "AI Assistant",    url: "/dashboard/agent",         icon: Sparkles },
]

// ── Default nav (not onboarded yet) ─────────────────────────────
const defaultNav = [
  { title: "Home",        url: "/dashboard",               icon: Home },
  { title: "Browse Open Projects", url: "/dashboard/open-bounties", icon: CircleDollarSign },
  { title: "Labs",        url: "/dashboard/labs",          icon: FlaskConical },
  { title: "AI Assistant", url: "/dashboard/agent",        icon: Sparkles },
]

const bottomNav = [
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  const { dbUser } = useAuth()

  const role = dbUser?.role
  const navItems = role === 'funder' || role === 'admin'
    ? funderNav
    : role === 'lab'
      ? labNav
      : defaultNav

  const isActive = (url: string) =>
    url === "/dashboard"
      ? pathname === url
      : pathname.startsWith(url)

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-14 border-b border-sidebar-border px-3 shrink-0">
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-2.5 w-full text-left"
          title="Toggle sidebar"
        >
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

      {/* Role label */}
      {!collapsed && role && role !== 'admin' && (
        <div className="px-3 py-2 border-b border-sidebar-border/50">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            role === 'funder' ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"
          )}>
            {role === 'funder' ? 'Funding research' : 'Researcher'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            title={collapsed ? item.title : undefined}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
              isActive(item.url)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
              // Highlight the primary action
              'action' in item && item.action && !isActive(item.url) &&
                "text-accent/90 hover:text-accent"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}

        {/* Disputes — only show if relevant */}
        {(role === 'funder' || role === 'admin') && (
          <Link
            href="/dashboard/disputes"
            title={collapsed ? 'Disputes' : undefined}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
              pathname.startsWith('/dashboard/disputes')
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Scale className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Disputes</span>}
          </Link>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-0.5">
        {bottomNav.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            title={collapsed ? item.title : undefined}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors duration-150",
              pathname === item.url
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        ))}

        {/* Admin queue */}
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

        {!collapsed && <ConnectWalletButton variant="sidebar" />}
      </div>
    </aside>
  )
}
