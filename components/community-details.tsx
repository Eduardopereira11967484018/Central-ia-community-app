"use client"

import type { Community, User } from "@/types"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"

interface CommunityDetailsProps {
  community: Community
  members: User[]
}

export default function CommunityDetails({ community, members: initialMembers }: CommunityDetailsProps) {
  const { user } = useAuth()
  const [isMember, setIsMember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [members, setMembers] = useState(initialMembers)
  const [memberCount, setMemberCount] = useState(community.member_count || 0)
  const supabase = createBrowserClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      const checkMembership = async () => {
        const { data } = await supabase
          .from("community_members")
          .select()
          .eq("community_id", community.id)
          .eq("user_id", user.id)
          .single()

        setIsMember(!!data)
      }

      checkMembership()
    }
  }, [community.id, user, supabase])

  const handleJoinLeave = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join communities",
      })
      router.push("/sign-in")
      return
    }

    setIsLoading(true)

    try {
      if (isMember) {
        // Leave community
        await supabase.from("community_members").delete().eq("community_id", community.id).eq("user_id", user.id)

        setIsMember(false)
        setMemberCount((prev) => prev - 1)
        setMembers(members.filter((member) => member.id !== user.id))

        toast({
          title: "Left community",
          description: `You have left ${community.name}`,
        })
      } else {
        // Join community
        await supabase.from("community_members").insert({
          community_id: community.id,
          user_id: user.id,
        })

        setIsMember(true)
        setMemberCount((prev) => prev + 1)

        if (user) {
          setMembers([...members, user])
        }

        toast({
          title: "Joined community",
          description: `You have joined ${community.name}`,
        })

        // Redireciona para o chat após entrar na comunidade
        router.push(`/communities/${community.id}/chat`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update membership. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={community.image_url || ""} alt={community.name} />
              <AvatarFallback>{community.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{community.name}</h1>
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                <span>{memberCount} members</span>
              </div>
            </div>
          </div>

          <div className="prose max-w-none">
            <p>{community.description}</p>
          </div>

          <Button onClick={handleJoinLeave} disabled={isLoading} variant={isMember ? "outline" : "default"}>
            {isLoading ? "Processing..." : isMember ? "Leave Community" : "Join Community"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Members</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col items-center text-center">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.avatar_url || ""} alt={member.name} />
                <AvatarFallback>{member.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="mt-2 text-sm font-medium truncate max-w-full">{member.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
