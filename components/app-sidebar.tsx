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
  CircleDollarSign,
  Shield
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { SciFlowLogo } from "@/components/sciflow-logo"

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

const adminMenuItems = [
  { title: "Admin Dashboard", url: "/dashboard/admin", icon: Shield },
]

const accountMenuItems = [
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: LifeBuoy },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state: sidebarState } = useSidebar()
  const { dbUser, walletAddress, isAuthenticated, isAdmin } = useAuth()

  return (
    <Sidebar collapsible="icon" side="left" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="SciFlow Home" className="hover:bg-sidebar-accent">
              <Link href="/" className="flex items-center">
                <SciFlowLogo 
                  size="sm"
                  showText={sidebarState === "expanded"}
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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

        {/* Admin (conditionally shown) */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-red-400/90 uppercase tracking-wider">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.url)}
                      tooltip={item.title}
                      className="text-slate-200 hover:text-white hover:bg-sidebar-accent data-[active=true]:bg-red-500/25 data-[active=true]:text-red-300 data-[active=true]:font-medium"
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
        )}
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
        {sidebarState === "expanded" && isAuthenticated && walletAddress && (
          <div className="px-3 py-3 mt-2 mx-1 rounded-lg bg-emerald-900/40 border border-emerald-700/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-200 font-medium">Wallet Connected</span>
            </div>
            <p className="text-xs font-mono text-slate-300 mt-1 truncate">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
          </div>
        )}
        {sidebarState === "expanded" && isAuthenticated && !walletAddress && dbUser && (
          <div className="px-3 py-3 mt-2 mx-1 rounded-lg bg-blue-900/40 border border-blue-700/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs text-blue-200 font-medium">Signed In</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 truncate">
              {dbUser.full_name || dbUser.email || 'User'}
            </p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
