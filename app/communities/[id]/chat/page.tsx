"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import CommunityChat from "@/components/CommunityChat"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function CommunityChatPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [isMember, setIsMember] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        router.push("/sign-in")
        return
      }

      const { data } = await supabase
        .from("community_members")
        .select()
        .eq("community_id", id)
        .eq("user_id", user.id)
        .single()

      setIsMember(!!data)
      setIsLoading(false)
    }

    checkMembership()
  }, [id, user, router, supabase])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground mb-6">
          You need to be a member of this community to access the chat.
        </p>
        <Button onClick={() => router.push(`/communities/${id}`)}>
          Join Community
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <CommunityChat communityId={id as string} />
      </div>
    </div>
  )
} 