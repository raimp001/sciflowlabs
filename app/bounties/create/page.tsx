"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, X, DollarSign, Target, Lightbulb } from "lucide-react"
import { format } from "date-fns"

export default function CreateBountyPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [researchArea, setResearchArea] = useState("")
  const [fundingAmount, setFundingAmount] = useState("")
  const [deadline, setDeadline] = useState<Date>()
  const [urgency, setUrgency] = useState("")
  const [estimatedDuration, setEstimatedDuration] = useState("")
  const [objectives, setObjectives] = useState<string[]>([""])
  const [deliverables, setDeliverables] = useState<string[]>([""])
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")

  const addObjective = () => {
    setObjectives([...objectives, ""])
  }

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index))
  }

  const updateObjective = (index: number, value: string) => {
    const newObjectives = [...objectives]
    newObjectives[index] = value
    setObjectives(newObjectives)
  }

  const addDeliverable = () => {
    setDeliverables([...deliverables, ""])
  }

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  const updateDeliverable = (index: number, value: string) => {
    const newDeliverables = [...deliverables]
    newDeliverables[index] = value
    setDeliverables(newDeliverables)
  }

  const addTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag])
      setCurrentTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Here you would typically send the data to your backend
    console.log({
      title,
      description,
      researchArea,
      fundingAmount: Number(fundingAmount),
      deadline,
      urgency,
      estimatedDuration,
      objectives: objectives.filter((o) => o.trim() !== ""),
      deliverables: deliverables.filter((d) => d.trim() !== ""),
      tags,
    })

    // Show success message and redirect
    alert("Bounty created successfully!")
    router.push("/bounties")
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create Research Bounty</h1>
        <p className="text-muted-foreground">
          Fund breakthrough research by creating a bounty for labs to work on your idea
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Provide the essential details about your research bounty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Bounty Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Identify Actionable Mutations in Colorectal Cancer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide a detailed description of the research project, its goals, and why it matters..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="researchArea">Research Area *</Label>
                <Select value={researchArea} onValueChange={setResearchArea} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select research area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oncology">Oncology</SelectItem>
                    <SelectItem value="neuroscience">Neuroscience</SelectItem>
                    <SelectItem value="immunology">Immunology</SelectItem>
                    <SelectItem value="genetics">Genetics</SelectItem>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="infectious_disease">Infectious Disease</SelectItem>
                    <SelectItem value="rare_disease">Rare Disease</SelectItem>
                    <SelectItem value="drug_discovery">Drug Discovery</SelectItem>
                    <SelectItem value="diagnostics">Diagnostics</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency *</Label>
                <Select value={urgency} onValueChange={setUrgency} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funding and Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Funding & Timeline
            </CardTitle>
            <CardDescription>Set your budget and expected timeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="funding">Total Funding Amount (USD) *</Label>
                <Input
                  id="funding"
                  type="number"
                  placeholder="e.g., 50000000"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  min="0"
                  step="100000"
                  required
                />
                {fundingAmount && (
                  <p className="text-sm text-muted-foreground">
                    ${Number(fundingAmount).toLocaleString()} USD
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 24 months"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Deadline *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : <span>Pick a deadline</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Research Objectives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Research Objectives
            </CardTitle>
            <CardDescription>Define the key objectives of this research project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {objectives.map((objective, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Objective ${index + 1}`}
                  value={objective}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  required={index === 0}
                />
                {objectives.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeObjective(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addObjective} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Objective
            </Button>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle>Expected Deliverables</CardTitle>
            <CardDescription>What should the lab deliver upon completion?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliverables.map((deliverable, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Deliverable ${index + 1}`}
                  value={deliverable}
                  onChange={(e) => updateDeliverable(index, e.target.value)}
                  required={index === 0}
                />
                {deliverables.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDeliverable(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addDeliverable} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Deliverable
            </Button>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Add relevant tags to help labs discover your bounty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag (e.g., cancer, genomics)"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X
                      className="ml-1 h-3 w-3"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={() => router.push("/bounties")}>
            Cancel
          </Button>
          <Button type="submit" size="lg">
            Create Bounty
          </Button>
        </div>
      </form>
    </div>
  )
}
