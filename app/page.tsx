import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to CommunityApp</h1>
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
        Discover, create, and join communities of like-minded people. Share your interests and connect with others.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/communities">Explore Communities</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/communities/create">Create Community</Link>
        </Button>
      </div>
    </div>
  )
}
