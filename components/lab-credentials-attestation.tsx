"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Shield, ExternalLink, Loader2, CheckCircle2, GraduationCap, Award, FileCheck } from 'lucide-react'
import { useAttestations } from '@/hooks/use-attestations'
import { getAttestationUrl, type LabCredentialAttestation } from '@/lib/attestations/eas'

interface LabCredentialsAttestationProps {
  existingAttestations?: Array<{
    uid: string
    credentialType: string
    institution: string
    degree: string
    year: number
  }>
}

export function LabCredentialsAttestation({ existingAttestations = [] }: LabCredentialsAttestationProps) {
  const { attestCredential, isAttesting, isConnected, lastResult } = useAttestations()
  const [showForm, setShowForm] = useState(false)
  const [credential, setCredential] = useState<LabCredentialAttestation>({
    credentialType: 'degree',
    institution: '',
    degree: '',
    year: new Date().getFullYear(),
    documentHash: '',
    verified: false,
  })

  const handleAttest = async () => {
    if (!credential.institution || !credential.degree) return
    const result = await attestCredential(credential)
    if (result.success) {
      setShowForm(false)
      setCredential({
        credentialType: 'degree',
        institution: '',
        degree: '',
        year: new Date().getFullYear(),
        documentHash: '',
        verified: false,
      })
    }
  }

  const credentialIcons: Record<string, typeof GraduationCap> = {
    degree: GraduationCap,
    certification: Award,
    license: FileCheck,
    membership: Shield,
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          On-Chain Credentials
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Attest your credentials on Base via EAS. Share them instantly with any bounty proposal.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing attestations */}
        {existingAttestations.length > 0 && (
          <div className="space-y-2">
            {existingAttestations.map((att) => {
              const Icon = credentialIcons[att.credentialType] || Shield
              return (
                <div
                  key={att.uid}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{att.degree}</p>
                      <p className="text-xs text-muted-foreground">
                        {att.institution} &middot; {att.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-xs">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      On-chain
                    </Badge>
                    <a
                      href={getAttestationUrl(att.uid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Last result feedback */}
        {lastResult && (
          <div className={`p-3 rounded-lg text-sm ${
            lastResult.success
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {lastResult.success
              ? 'Credential attested on Base. It may take a moment to appear on EAS scan.'
              : lastResult.error}
          </div>
        )}

        {/* Add credential form */}
        {showForm ? (
          <div className="space-y-3 p-4 border border-border rounded-lg">
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Credential Type</Label>
              <Select
                value={credential.credentialType}
                onValueChange={(v) => setCredential({ ...credential, credentialType: v as LabCredentialAttestation['credentialType'] })}
              >
                <SelectTrigger className="border-border bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  <SelectItem value="degree">Degree</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="license">License</SelectItem>
                  <SelectItem value="membership">Professional Membership</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm">Institution</Label>
              <Input
                value={credential.institution}
                onChange={(e) => setCredential({ ...credential, institution: e.target.value })}
                placeholder="e.g., MIT, Harvard, IEEE"
                className="border-border bg-background text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Degree / Title</Label>
                <Input
                  value={credential.degree}
                  onChange={(e) => setCredential({ ...credential, degree: e.target.value })}
                  placeholder="e.g., Ph.D. Chemistry"
                  className="border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Year</Label>
                <Input
                  type="number"
                  value={credential.year}
                  onChange={(e) => setCredential({ ...credential, year: parseInt(e.target.value) || 0 })}
                  className="border-border bg-background text-foreground"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground text-sm">Document Hash (IPFS CID)</Label>
              <Input
                value={credential.documentHash}
                onChange={(e) => setCredential({ ...credential, documentHash: e.target.value })}
                placeholder="Optional: IPFS hash of supporting document"
                className="border-border bg-background text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Upload your credential to IPFS and paste the CID for verifiable proof.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 border-border text-foreground hover:bg-secondary rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAttest}
                disabled={isAttesting || !credential.institution || !credential.degree}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
              >
                {isAttesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Attesting...
                  </>
                ) : (
                  'Attest On-Chain'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowForm(true)}
            disabled={!isConnected}
            variant="outline"
            className="w-full border-border text-foreground hover:bg-secondary rounded-full"
          >
            {isConnected ? 'Add Credential Attestation' : 'Connect Wallet to Attest'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
