"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { 
  Home, 
  FlaskConical, 
  FileText, 
  Users, 
  Settings, 
  UserCircle, 
  LifeBuoy,
  Wallet,
  Scale,
  BarChart3,
  ShieldCheck,
  CircleDollarSign
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"

// SciFlow Navigation Items
const funderMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Bounties", url: "/dashboard/bounties", icon: FileText },
  { title: "Browse Labs", url: "/dashboard/labs", icon: FlaskConical },
  { title: "Escrow", url: "/dashboard/escrow", icon: Wallet },
]

const labMenuItems = [
  { title: "Open Bounties", url: "/dashboard/open-bounties", icon: CircleDollarSign },
  { title: "My Proposals", url: "/dashboard/proposals", icon: FileText },
  { title: "Active Research", url: "/dashboard/research", icon: FlaskConical },
  { title: "Staking", url: "/dashboard/staking", icon: ShieldCheck },
]

const platformMenuItems = [
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Disputes", url: "/dashboard/disputes", icon: Scale },
  { title: "Leaderboard", url: "/dashboard/leaderboard", icon: Users },
]

const accountMenuItems = [
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: LifeBuoy },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state: sidebarState } = useSidebar()

  return (
    <Sidebar collapsible="icon" side="left" className="border-r-0">
      <SidebarHeader className="p-2 flex items-center justify-between border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 font-semibold px-2 py-1">
          {/* SciFlow Logo */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-navy-900">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54" />
              <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54" />
            </svg>
          </div>
          {sidebarState === "expanded" && (
            <span className="text-lg font-bold text-slate-100">SciFlow</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {/* Funder Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider">
            Funder
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {funderMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.url || (item.url !== "/dashboard" && pathname.startsWith(item.url))} 
                    tooltip={item.title}
                    className="text-slate-200 hover:text-white hover:bg-sidebar-accent data-[active=true]:bg-amber-500/25 data-[active=true]:text-amber-300 data-[active=true]:font-medium"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Lab Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-emerald-400/90 uppercase tracking-wider">
            Lab / Researcher
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {labMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname.startsWith(item.url)} 
                    tooltip={item.title}
                    className="text-slate-200 hover:text-white hover:bg-sidebar-accent data-[active=true]:bg-emerald-500/25 data-[active=true]:text-emerald-300 data-[active=true]:font-medium"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Platform */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-sky-400/90 uppercase tracking-wider">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname.startsWith(item.url)} 
                    tooltip={item.title}
                    className="text-slate-200 hover:text-white hover:bg-sidebar-accent data-[active=true]:bg-sky-500/25 data-[active=true]:text-sky-300 data-[active=true]:font-medium"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border pt-2">
        <SidebarMenu>
          {accountMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.url} 
                tooltip={item.title}
                className="text-slate-300 hover:text-white hover:bg-sidebar-accent data-[active=true]:bg-slate-600/40 data-[active=true]:text-white data-[active=true]:font-medium"
              >
                <Link href={item.url}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        {/* Wallet connection indicator */}
        {sidebarState === "expanded" && (
          <div className="px-3 py-3 mt-2 mx-1 rounded-lg bg-emerald-900/40 border border-emerald-700/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-200 font-medium">Wallet Connected</span>
            </div>
            <p className="text-xs font-mono text-slate-300 mt-1 truncate">
              0x1a2b...3c4d
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
