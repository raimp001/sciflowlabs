import type React from "react"
import type { Metadata } from "next"
import { Inter, Merriweather, JetBrains_Mono } from "next/font/google"
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
import { HeaderWallet } from "@/components/header-wallet"

// Sans-serif for UI elements
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

// Serif for contract/document text
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
})

// Monospace for code, hashes, addresses
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
})

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
      className={`${inter.variable} ${merriweather.variable} ${jetbrainsMono.variable}`}
    >
      <body className={inter.className}>
        <OrganizationStructuredData />
        <WebsiteStructuredData />
        <SoftwareApplicationStructuredData />
        <FAQStructuredData />
        <Providers>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <div className="flex flex-col flex-1 md:ml-[var(--sidebar-width-icon)] group-data-[sidebar-state=expanded]:md:ml-[var(--sidebar-width)] transition-[margin-left] duration-200 ease-linear">
              {/* Header with branding */}
              <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
                <div className="flex items-center gap-8">
                  <div className="flex items-center">
                    <div className="md:hidden">
                      <SidebarTrigger />
                    </div>
                    <Link href="/" className="ml-2 md:ml-0">
                      <span className="text-base font-semibold tracking-tight text-foreground">SciFlow</span>
                    </Link>
                  </div>
                  <nav className="hidden md:flex items-center gap-6">
                    <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</Link>
                    <Link href="/whitepaper" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Whitepaper</Link>
                    <Link href="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
                  </nav>
                </div>
                <HeaderWallet />
              </header>
              
              <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}
