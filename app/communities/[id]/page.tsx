import { createServerClient } from "@/lib/supabase";
import type { Community } from "@/types";
import { notFound } from "next/navigation";
import CommunityDetails from "@/components/community-details";

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>; // Type params as a Promise for App Router
}

async function getCommunity(id: string): Promise<Community | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("communities")
    .select(`
      *,
      member_count:community_members(count)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    member_count: data.member_count[0].count,
  };
}

async function getCommunityMembers(communityId: string) {
  const supabase = createServerClient();

  const { data: members, error } = await supabase
    .from("community_members")
    .select(`
      *,
      users:user_id (
        id,
        email,
        name,
        avatar_url
      )
    `)
    .eq("community_id", communityId);

  if (error) {
    console.error("Error fetching members:", error);
    return [];
  }

  return members;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params; // Await params to get id
  const community = await getCommunity(id);

  if (!community) {
    return {
      title: "Community Not Found",
    };
  }

  return {
    title: community.name,
    description: community.description,
  };
}

export default async function CommunityPage({ params }: PageProps) {
  const { id } = await params; // Await params to get id

  if (!id) {
    notFound();
  }

  const [community, members] = await Promise.all([
    getCommunity(id),
    getCommunityMembers(id),
  ]);

  if (!community) {
    notFound();
  }

  return <CommunityDetails community={community} members={members} />;
}