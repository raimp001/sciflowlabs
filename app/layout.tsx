import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar" // Assuming sidebar components are in ui
import { AppSidebar } from "@/components/app-sidebar"

export const metadata: Metadata = {
  title: "LabBounty - Scientific Research Funding Platform",
  description: "Connect breakthrough ideas with world-class research labs. Fund the science that matters to you.",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <div className="flex flex-col flex-1 md:ml-[var(--sidebar-width-icon)] group-data-[sidebar-state=expanded]:md:ml-[var(--sidebar-width)] transition-[margin-left] duration-200 ease-linear">
              {/* The SidebarInset component could be used here if variant="inset" for Sidebar */}
              <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
                <h1 className="text-lg font-semibold ml-2 md:ml-0">LabBounty</h1>
              </header>
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
