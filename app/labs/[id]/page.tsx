"use client"

import { use } from "react"
import { mockLabs } from "@/lib/bounty-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Globe,
  Users,
  Award,
  TrendingUp,
  Star,
  CheckCircle2,
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Microscope
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const lab = mockLabs.find((l) => l.id === id)

  if (!lab) {
    notFound()
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/labs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Labs
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl md:text-4xl font-bold">{lab.name}</h1>
              {lab.verified && (
                <CheckCircle2 className="h-6 w-6 text-blue-500" title="Verified Lab" />
              )}
            </div>
            <p className="text-lg text-muted-foreground mb-4">{lab.description}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{lab.location}</span>
              </div>
              {lab.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={lab.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {lab.website.replace("https://", "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Established {lab.established}</span>
              </div>
            </div>
          </div>
          <Button size="lg" className="shadow-soft-lg">
            Contact Lab
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-primary mt-1" />
              <div>
                <div className="text-2xl font-bold">{lab.completedBounties}</div>
                <div className="text-xs text-muted-foreground">Completed Bounties</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-1" />
              <div>
                <div className="text-2xl font-bold">{lab.activeBounties}</div>
                <div className="text-xs text-muted-foreground">Active Bounties</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-500 mt-1" />
              <div>
                <div className="text-2xl font-bold">{lab.successRate}%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-1" />
              <div>
                <div className="text-2xl font-bold">{lab.teamSize}</div>
                <div className="text-xs text-muted-foreground">Team Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specializations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Microscope className="h-5 w-5" />
                Research Specializations
              </CardTitle>
              <CardDescription>Areas of expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lab.specializations.map((spec) => (
                  <Badge key={spec} variant="default" className="capitalize">
                    {spec.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Core Capabilities</CardTitle>
              <CardDescription>Technical expertise and services offered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lab.capabilities.map((capability) => (
                  <div key={capability} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-sm">{capability}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader>
              <CardTitle>Equipment & Facilities</CardTitle>
              <CardDescription>State-of-the-art research infrastructure</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {lab.equipment.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-bold text-primary">{lab.successRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary rounded-full h-2"
                    style={{ width: `${lab.successRate}%` }}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Funding</span>
                <span className="font-bold text-primary">
                  {formatCurrency(lab.totalFundingReceived)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-bold">{lab.rating}</span>
                  <span className="text-sm text-muted-foreground">/5</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publications */}
          {lab.publications && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Research Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{lab.publications}</div>
                  <div className="text-sm text-muted-foreground">Published Papers</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Team Size</span>
                <span className="font-semibold">{lab.teamSize} members</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Established</span>
                <span className="font-semibold">{lab.established}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="font-semibold text-right flex-1 ml-4">{lab.location}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact CTA */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-3">
                <Building2 className="h-8 w-8 text-primary mx-auto" />
                <h3 className="font-semibold">Ready to collaborate?</h3>
                <p className="text-sm text-muted-foreground">
                  Get in touch to discuss your research needs
                </p>
                <Button className="w-full">Contact Lab</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
