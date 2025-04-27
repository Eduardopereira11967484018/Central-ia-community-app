"use client"

import type { Community } from "@/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Users } from "lucide-react"

interface CommunityListProps {
  communities: Community[]
}

export default function CommunityList({ communities }: CommunityListProps) {
  if (communities.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">No communities found</h2>
        <p className="text-muted-foreground mt-2">Be the first to create a community!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {communities.map((community) => (
        <Link href={`/communities/${community.id}`} key={community.id}>
          <Card className="h-full hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={community.image_url || ""} alt={community.name} />
                  <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{community.name}</h3>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-3">{community.description}</p>
            </CardContent>
            <CardFooter>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span>{community.member_count} members</span>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
