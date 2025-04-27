"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface JoinCommunityProps {
  communityId: string
  onJoinSuccess?: () => void
}

export default function JoinCommunity({ communityId, onJoinSuccess }: JoinCommunityProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const handleJoin = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to join a community",
        variant: "destructive",
      })
      router.push(`/sign-in?redirectTo=/communities/${communityId}`)
      return
    }

    setIsLoading(true)

    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("community_members")
        .select()
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .single()

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You are already a member of this community",
        })
        onJoinSuccess?.()
        return
      }

      // Join community
      const { error } = await supabase.from("community_members").insert({
        community_id: communityId,
        user_id: user.id,
        role: "member",
      })

      if (error) throw error

      toast({
        title: "Joined successfully",
        description: "You have joined the community",
      })

      // Call the success callback
      onJoinSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join community. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleJoin} disabled={isLoading}>
      {isLoading ? "Joining..." : "Join Community"}
    </Button>
  )
} 