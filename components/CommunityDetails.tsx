import Image from 'next/image';
import { Member } from '../types';
import CommunityChat from './CommunityChat';
import JoinCommunity from './JoinCommunity';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';

interface CommunityDetailsProps {
  community: {
    id: string;
    name: string;
    description: string;
    avatar_url: string;
  };
  members: Member[];
}

export default function CommunityDetails({ community, members }: CommunityDetailsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setIsMember(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from("community_members")
          .select()
          .eq("community_id", community.id)
          .eq("user_id", user.id)
          .single();

        setIsMember(!!data);
      } catch (error) {
        console.error("Error checking membership:", error);
        setIsMember(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMembership();
  }, [user, community.id, supabase]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {community.avatar_url && (
              <div className="relative w-20 h-20">
                <Image
                  src={community.avatar_url}
                  alt={community.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{community.name}</h1>
              <p className="text-gray-600">{community.description}</p>
            </div>
          </div>
          {!user ? (
            <Button onClick={() => router.push(`/sign-in?redirectTo=/communities/${community.id}`)}>
              Sign in to Join
            </Button>
          ) : !isMember ? (
            <JoinCommunity communityId={community.id} onJoinSuccess={() => setIsMember(true)} />
          ) : (
            <Button variant="outline" disabled>
              Member
            </Button>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Members ({members.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                {member.users.avatar_url && (
                  <div className="relative w-10 h-10">
                    <Image
                      src={member.users.avatar_url}
                      alt={member.users.name || member.users.email}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium">{member.users.name || 'Anonymous'}</p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {isMember && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Community Chat</h2>
            <CommunityChat communityId={community.id} />
          </div>
        )}
      </div>
    </div>
  );
}