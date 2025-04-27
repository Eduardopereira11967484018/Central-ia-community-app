"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

export default function Header() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          CommunityApp
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            Home
          </Link>
          <Link href="/communities" className="text-muted-foreground hover:text-foreground">
            Communities
          </Link>
          {user ? (
            <>
              <Button variant="outline" onClick={() => router.push("/communities/create")}>
                Create Community
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/my-communities")}>My Communities</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/sign-in")}>
                Sign In
              </Button>
              <Button onClick={() => router.push("/sign-up")}>Sign Up</Button>
            </div>
          )}
        </nav>  
      </div>
    </header>
  )
}
