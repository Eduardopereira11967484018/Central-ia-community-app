"use client"

// Componente de chat para comunidades
// Permite comunicação entre membros e integração com IA
// Armazena mensagens no Supabase e exibe em tempo real
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

// Interface para mensagens do chat
interface Message {
  id: string
  content: string
  created_at: string
  user_id: string
  user: {
    name: string
    avatar_url: string
  }
}

// Props do componente
interface CommunityChatProps {
  communityId: string
}

export default function CommunityChat({ communityId }: CommunityChatProps) {
  // Estados para gerenciar mensagens
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const { user } = useAuth()
  const supabase = createBrowserClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setIsMember(false)
        setIsLoading(false)
        return
      }

      try {
        const { data } = await supabase
          .from("community_members")
          .select()
          .eq("community_id", communityId)
          .eq("user_id", user.id)
          .single()

        setIsMember(!!data)
      } catch (error) {
        console.error("Error checking membership:", error)
        setIsMember(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkMembership()
  }, [user, communityId, supabase])

  useEffect(() => {
    if (!isMember) {
      return
    }

    // Fetch initial messages
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            user_id,
            user:users(name, avatar_url)
          `)
          .eq('community_id', communityId)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching messages:', error)
          toast({
            title: "Error",
            description: "Failed to load messages. Please try again.",
            variant: "destructive",
          })
          return
        }

        setMessages(data || [])
      } catch (error) {
        console.error('Error:', error)
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        })
      }
    }

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`community:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [communityId, supabase, isMember, toast])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !isMember) return

    try {
      const { error } = await supabase.from('messages').insert({
        content: newMessage,
        community_id: communityId,
        user_id: user.id,
      })

      if (error) {
        console.error('Error sending message:', error)
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
        return
      }

      setNewMessage('')
    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="mb-4">Please sign in to access the chat.</p>
        <Button onClick={() => router.push(`/sign-in?redirectTo=/communities/${communityId}`)}>
          Sign In
        </Button>
      </div>
    )
  }

  if (!isMember) {
    return (
      <div className="text-center py-4">
        <p>You need to be a member to access the chat.</p>
      </div>
    )
  }

  if (isLoading) {
    return <div className="text-center py-4">Loading chat...</div>
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.user_id === user?.id ? 'flex-row-reverse' : ''
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.user.avatar_url || ''} />
                <AvatarFallback>{message.user.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div
                className={`rounded-lg px-4 py-2 max-w-[70%] ${
                  message.user_id === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}