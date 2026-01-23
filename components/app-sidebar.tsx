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
import { Home, BarChart2, Settings, UserCircle, LifeBuoy, Target, PlusCircle, Building2, Beaker } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"

// Menu items.
const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Browse Bounties", url: "/bounties", icon: Target },
  { title: "Create Bounty", url: "/bounties/create", icon: PlusCircle },
  { title: "Labs", url: "/labs", icon: Building2 },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart2 },
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
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader className="p-2 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold px-2">
          <Beaker className="h-6 w-6" />
          {sidebarState === "expanded" && <span>LabBounty</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)} tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {accountMenuItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
