"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  UserCircle,
  Mail,
  Building2,
  MapPin,
  Globe,
  FlaskConical,
  Wallet,
  Shield,
  Star,
  Edit2,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { LabCredentialsAttestation } from "@/components/lab-credentials-attestation"
import { ConnectedWalletCard } from "@/components/base-identity"
import Link from "next/link"

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state (would be populated from user data in production)
  const [formData, setFormData] = useState({
    displayName: user?.email?.split("@")[0] || "User",
    email: user?.email || "",
    role: "funder", // "funder" | "lab" | "both"
    organization: "",
    country: "",
    website: "",
    bio: "",
    walletAddress: "",
  })

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setIsEditing(false)
  }

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account</p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-10 text-center">
            <UserCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Sign in to view your profile
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create an account or sign in to manage your profile, track bounties, and connect with labs.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                  Create Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Preview of what profile includes */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">What you can do with a profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <FlaskConical className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Post & manage bounties</p>
                <p className="text-sm text-muted-foreground">Create research bounties and track their progress</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Apply as a verified lab</p>
                <p className="text-sm text-muted-foreground">Get verified and submit proposals to bounties</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Connect payment methods</p>
                <p className="text-sm text-muted-foreground">Link wallets or bank accounts for payouts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Build reputation</p>
                <p className="text-sm text-muted-foreground">Earn reputation through successful bounties</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
        </div>
        {!isEditing ? (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="border-border text-foreground hover:bg-secondary"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="border-border text-foreground hover:bg-secondary"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="displayName" className="text-foreground">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="mt-1 border-border bg-background text-foreground"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold text-foreground">{formData.displayName}</h2>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {formData.email || "No email set"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-primary/10 text-primary border-0">
                      {formData.role === "funder" ? "Funder" : formData.role === "lab" ? "Lab" : "Funder & Lab"}
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-700 border-0">
                      <Clock className="w-3 h-3 mr-1" />
                      Unverified
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Role Selection (Edit mode) */}
          {isEditing && (
            <div className="mb-6">
              <Label htmlFor="role" className="text-foreground">Primary Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="mt-1 border-border bg-background text-foreground">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  <SelectItem value="funder">Funder (I want to post bounties)</SelectItem>
                  <SelectItem value="lab">Lab / Researcher (I want to complete bounties)</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid gap-4">
            {/* Organization */}
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Organization
              </Label>
              {isEditing ? (
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="Company or institution name"
                  className="mt-1 border-border bg-background text-foreground"
                />
              ) : (
                <p className="text-foreground flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  {formData.organization || "Not specified"}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Country
              </Label>
              {isEditing ? (
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="e.g., United States"
                  className="mt-1 border-border bg-background text-foreground"
                />
              ) : (
                <p className="text-foreground flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {formData.country || "Not specified"}
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Website
              </Label>
              {isEditing ? (
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="mt-1 border-border bg-background text-foreground"
                />
              ) : (
                <p className="text-foreground flex items-center gap-2 mt-1">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  {formData.website ? (
                    <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {formData.website}
                    </a>
                  ) : (
                    "Not specified"
                  )}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                Bio
              </Label>
              {isEditing ? (
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself or your organization..."
                  rows={3}
                  className="mt-1 border-border bg-background text-foreground"
                />
              ) : (
                <p className="text-foreground mt-1">
                  {formData.bio || "No bio added yet."}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Connected Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ConnectedWalletCard />
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">{formData.email || "Not set"}</p>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700 border-0">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Organization (KYB)</p>
                  <p className="text-xs text-muted-foreground">Required for lab verification</p>
                </div>
              </div>
              <Badge className="bg-slate-100 text-slate-600 border-0">
                Not Started
              </Badge>
            </div>

            {formData.role !== "funder" && (
              <div className="pt-2">
                <Link href="/dashboard/apply-as-lab">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <FlaskConical className="w-4 h-4 mr-2" />
                    Apply for Lab Verification
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* On-Chain Credentials (for labs) */}
      {formData.role !== "funder" && (
        <LabCredentialsAttestation />
      )}

      {/* Stats Summary */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Bounties Posted</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Proposals</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-xs text-muted-foreground">Reputation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
