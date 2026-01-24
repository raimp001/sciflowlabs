import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 min-h-[80vh] flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center shadow-soft-lg">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/bounties">
              <Search className="mr-2 h-4 w-4" />
              Browse Bounties
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
