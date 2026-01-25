import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { cookies } from "next/headers"
import {
  OrganizationStructuredData,
  WebsiteStructuredData,
  SoftwareApplicationStructuredData,
  FAQStructuredData
} from "@/components/structured-data"
import Link from "next/link"

// Font CSS variables - using system font fallbacks
const fontVariables = "--font-sans --font-serif --font-mono"

export const metadata: Metadata = {
  metadataBase: new URL('https://sciflowlabs.com'),
  title: {
    default: "SciFlow | Decentralized Research Bounties",
    template: "%s | SciFlow"
  },
  description: "SciFlow is a decentralized science (DeSci) platform connecting funders with verified research labs through milestone-based bounties. Escrow-protected payments via Stripe, Solana USDC, and Base ensure accountability. Fund breakthrough research with trust.",
  keywords: [
    "DeSci",
    "decentralized science", 
    "research bounties",
    "scientific research funding",
    "crypto escrow",
    "Solana USDC",
    "Base blockchain",
    "milestone-based funding",
    "research labs",
    "scientific research marketplace",
    "Web3 science",
    "blockchain research",
    "research grants",
    "lab funding"
  ],
  authors: [{ name: "SciFlow Labs", url: "https://sciflowlabs.com" }],
  creator: "SciFlow Labs",
  publisher: "SciFlow Labs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sciflowlabs.com",
    siteName: "SciFlow",
    title: "SciFlow | Fund Breakthrough Research with Trust",
    description: "Decentralized science platform connecting funders with verified labs. Milestone-based bounties with escrow-protected payments via crypto and fiat.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SciFlow - Decentralized Research Bounties",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SciFlow | Decentralized Research Bounties",
    description: "Fund breakthrough research with milestone-based accountability. Escrow-protected payments via crypto & fiat.",
    images: ["/og-image.png"],
    creator: "@sciflowlabs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "7SroD-s4YZJUNIGueUIlLaiwHuX0ENQp8Ntebij8aC8",
  },
  alternates: {
    canonical: "https://sciflowlabs.com",
  },
  category: "technology",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true"

  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <OrganizationStructuredData />
        <WebsiteStructuredData />
        <SoftwareApplicationStructuredData />
        <FAQStructuredData />
        <Providers>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <div className="flex flex-col flex-1 md:ml-[var(--sidebar-width-icon)] group-data-[sidebar-state=expanded]:md:ml-[var(--sidebar-width)] transition-[margin-left] duration-200 ease-linear">
              {/* Header with branding */}
              <header className="sticky top-0 z-10 flex items-center h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>
                <Link href="/" className="ml-2 md:ml-0 flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                    <path d="M9 3V11L5 19C4.5 20 5 21 6 21H18C19 21 19.5 20 19 19L15 11V3" stroke="url(#hg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 3H15" stroke="url(#hg)" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="11" cy="15" r="1" fill="#34D399" />
                    <circle cx="14" cy="16" r="0.8" fill="#6EE7B7" />
                    <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#10B981" /></linearGradient></defs>
                  </svg>
                  <span className="text-base font-semibold text-slate-900 dark:text-white">Sci<span className="text-amber-500">Flow</span></span>
                </Link>
              </header>
              
              <main className="flex-1 p-4 md:p-6 bg-secondary/30">{children}</main>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
