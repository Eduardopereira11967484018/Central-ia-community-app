import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../utils/supabaseClient';
import CommunityDetails from '../../components/CommunityDetails';

interface Member {
  id: string;
  user_id: string;
  community_id: string;
  role: string;
  joined_at: string;
  users: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string;
  };
}

export async function getCommunityMembers(communityId: string) {
  const { data: members, error } = await supabase
    .from('memberships')
    .select(`
      *,
      users:user_id (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('community_id', communityId);

  if (error) {
    console.error('Error fetching members:', error);
    return [];
  }

  return members as Member[];
}

export default function CommunityPage() {
  const router = useRouter();
  const { id } = router.query;
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCommunityData() {
      if (!id) return;

      try {
        // Fetch community details
        const { data: communityData, error: communityError } = await supabase
          .from('communities')
          .select('*')
          .eq('id', id)
          .single();

        if (communityError) throw communityError;

        // Fetch members
        const membersData = await getCommunityMembers(id as string);
        
        setCommunity(communityData);
        setMembers(membersData);
      } catch (err) {
        setError('Failed to load community data');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCommunityData();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!community) return <div>Community not found</div>;

  return <CommunityDetails community={community} members={members} />;
}