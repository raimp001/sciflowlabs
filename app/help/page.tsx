"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { LifeBuoy, MessageCircle, Mail, HelpCircle, Lightbulb, DollarSign, Building2, Shield } from "lucide-react"
import { useState } from "react"

export default function HelpPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert("Support request submitted! We'll get back to you soon.")
    setEmail("")
    setMessage("")
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3 flex items-center justify-center gap-3">
          <LifeBuoy className="h-10 w-10 text-primary" />
          Help & Support
        </h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about LabBounty
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="text-center shadow-soft hover:shadow-soft-lg transition-all">
          <CardContent className="pt-6">
            <HelpCircle className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">FAQs</h3>
            <p className="text-sm text-muted-foreground">
              Find answers to common questions
            </p>
          </CardContent>
        </Card>
        <Card className="text-center shadow-soft hover:shadow-soft-lg transition-all">
          <CardContent className="pt-6">
            <MessageCircle className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Contact Support</h3>
            <p className="text-sm text-muted-foreground">
              Get help from our team
            </p>
          </CardContent>
        </Card>
        <Card className="text-center shadow-soft hover:shadow-soft-lg transition-all">
          <CardContent className="pt-6">
            <Lightbulb className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Best Practices</h3>
            <p className="text-sm text-muted-foreground">
              Learn how to maximize success
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Learn the basics of LabBounty</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is LabBounty?</AccordionTrigger>
                  <AccordionContent>
                    LabBounty is a platform that connects research funders with qualified laboratories.
                    Individuals or organizations can create research bounties with specific goals and funding,
                    and labs can apply to work on these projects. It democratizes scientific research funding
                    and makes it easier to fund breakthrough discoveries.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I create a bounty?</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Click "Create Bounty" in the navigation menu</li>
                      <li>Fill in your research idea, objectives, and deliverables</li>
                      <li>Set your funding amount and deadline</li>
                      <li>Add tags to help labs find your bounty</li>
                      <li>Submit your bounty for review</li>
                    </ol>
                    <p className="mt-3 text-sm">
                      Once approved, your bounty will be visible to all qualified labs.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How do labs apply to bounties?</AccordionTrigger>
                  <AccordionContent>
                    Labs can browse all open bounties, filter by research area and funding amount,
                    and submit applications showcasing their capabilities, relevant experience, and
                    proposed approach. Bounty creators review applications and select the lab that
                    best fits their requirements.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>What happens after a lab is selected?</AccordionTrigger>
                  <AccordionContent>
                    Once a lab is selected, a formal agreement is created outlining the research objectives,
                    deliverables, and milestone schedule. Funding is released in stages as milestones are
                    completed and verified. This ensures accountability and progress tracking throughout
                    the research project.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* For Funders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                For Funders
              </CardTitle>
              <CardDescription>Information for research sponsors</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="funder-1">
                  <AccordionTrigger>How is funding protected?</AccordionTrigger>
                  <AccordionContent>
                    Funds are held in escrow and released only when milestones are verified and approved.
                    This ensures that your investment is protected and labs are held accountable for
                    delivering results. You have full visibility into progress and can verify deliverables
                    before releasing each milestone payment.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="funder-2">
                  <AccordionTrigger>What are milestone payments?</AccordionTrigger>
                  <AccordionContent>
                    Milestone payments break your total funding into stages tied to specific deliverables.
                    For example, a $50M bounty might have 3 milestones: initial setup ($15M), research
                    completion ($20M), and final publication ($15M). This reduces risk and ensures
                    continuous progress.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="funder-3">
                  <AccordionTrigger>Can I communicate with labs before selection?</AccordionTrigger>
                  <AccordionContent>
                    Yes! After labs submit applications, you can message them to discuss their approach,
                    ask questions, and request additional information. This helps you make an informed
                    decision and ensures the selected lab fully understands your requirements.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* For Labs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                For Research Labs
              </CardTitle>
              <CardDescription>Information for laboratories</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="lab-1">
                  <AccordionTrigger>How do I get verified?</AccordionTrigger>
                  <AccordionContent>
                    Verified labs have a blue checkmark and higher visibility. To get verified:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>Complete your lab profile with detailed information</li>
                      <li>Submit proof of institutional affiliation</li>
                      <li>Provide references from past research projects</li>
                      <li>Upload certifications and accreditations</li>
                    </ul>
                    <p className="mt-2 text-sm">Verification typically takes 3-5 business days.</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="lab-2">
                  <AccordionTrigger>How do I improve my success rate?</AccordionTrigger>
                  <AccordionContent>
                    Your success rate is the percentage of accepted bounties you've completed successfully.
                    To maintain a high rate: deliver on time, communicate regularly with funders, meet
                    all deliverables, and maintain research quality. High success rates lead to more
                    opportunities and higher-value bounties.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="lab-3">
                  <AccordionTrigger>What if I can't complete a bounty?</AccordionTrigger>
                  <AccordionContent>
                    If unforeseen circumstances prevent completion, communicate immediately with the funder.
                    You may be able to renegotiate timelines or milestones. However, failing to communicate
                    or abandoning a bounty will significantly impact your success rate and reputation on
                    the platform.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Safety & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Safety & Security
              </CardTitle>
              <CardDescription>How we protect your interests</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="safety-1">
                  <AccordionTrigger>Is my data secure?</AccordionTrigger>
                  <AccordionContent>
                    Yes. We use industry-standard encryption for all data transmission and storage.
                    Your personal information, payment details, and research data are protected with
                    bank-level security. We never share your data with third parties without your
                    explicit consent.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="safety-2">
                  <AccordionTrigger>How do you prevent fraud?</AccordionTrigger>
                  <AccordionContent>
                    We verify all labs and monitor all transactions. Suspicious activity triggers
                    automatic reviews. Funds are held in escrow until milestones are verified. We
                    also maintain a dispute resolution process to handle any conflicts fairly.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Support
              </CardTitle>
              <CardDescription>
                Can't find what you're looking for? Send us a message.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Need immediate help?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Chat with our support team
              </p>
              <Button variant="outline" className="w-full">
                Start Live Chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
