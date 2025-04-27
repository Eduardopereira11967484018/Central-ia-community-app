import { createServerClient } from "@/lib/supabase"
import type { Community } from "@/types"
import CommunityList from "@/components/community-list"

export const revalidate = 0

async function getCommunities(): Promise<Community[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("communities")
    .select(`
      *,
      member_count:community_members(count)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching communities:", error)
    return []
  }

  return data.map((community) => ({
    ...community,
    member_count: community.member_count[0].count,
  }))
}

export default async function CommunitiesPage() {
  const communities = await getCommunities()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Communities</h1>
        <p className="text-muted-foreground">Discover and join communities of like-minded people</p>
      </div>

      <CommunityList communities={communities} />
    </div>
  )
}
