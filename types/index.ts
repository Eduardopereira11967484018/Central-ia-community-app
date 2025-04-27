export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
}

export interface Community {
  id: string
  name: string
  description: string
  image_url?: string
  created_by: string
  created_at?: string
  member_count?: number
  is_member?: boolean
}

export interface CommunityMember {
  id: string
  community_id: string
  user_id: string
  role: string
  joined_at?: string
  users: User
}

export interface Member {
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
