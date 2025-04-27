"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import type { Community } from "@/types"
import { createBrowserClient } from "@/lib/supabase"
import CommunityList from "@/components/community-list"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MyCommunities() {
  const { user } = useAuth()
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([])
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient()
  const router = useRouter()

  useEffect(() => {
    const fetchCommunities = async () => {
      if (!user) {
        router.push("/sign-in")
        return
      }

      setIsLoading(true)

      try {
        // Fetch communities the user has joined
        const { data: memberData } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id)

        if (memberData && memberData.length > 0) {
          const communityIds = memberData.map((item) => item.community_id)

          const { data: communities } = await supabase
            .from("communities")
            .select(`
              *,
              member_count:community_members(count)
            `)
            .in("id", communityIds)

          if (communities) {
            const formattedCommunities = communities.map((community) => ({
              ...community,
              member_count: community.member_count[0].count,
            }))

            setJoinedCommunities(formattedCommunities)

            // Filter out communities created by the user
            setCreatedCommunities(formattedCommunities.filter((community) => community.created_by === user.id))
          }
        }
      } catch (error) {
        console.error("Error fetching communities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommunities()
  }, [user, router, supabase])

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Communities</h1>
          <p className="text-muted-foreground">Communities you've joined or created</p>
        </div>
        <Button onClick={() => router.push("/communities/create")}>Create Community</Button>
      </div>

      <Tabs defaultValue="joined">
        <TabsList>
          <TabsTrigger value="joined">Joined Communities</TabsTrigger>
          <TabsTrigger value="created">Created Communities</TabsTrigger>
        </TabsList>
        <TabsContent value="joined" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <CommunityList communities={joinedCommunities} />
          )}
        </TabsContent>
        <TabsContent value="created" className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <CommunityList communities={createdCommunities} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
