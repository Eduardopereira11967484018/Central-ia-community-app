"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase"
import { uploadToCloudinary } from "@/lib/cloudinary"

export default function CreateCommunity() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a community",
        variant: "destructive",
      })
      router.push("/sign-in")
      return
    }

    setIsLoading(true)

    try {
      let imageUrl = null

      // Upload image if provided
      if (image) {
        try {
          imageUrl = await uploadToCloudinary(image)
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload image. Please try again.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      // Create community
      const { data: community, error } = await supabase
        .from("communities")
        .insert({
          name,
          description,
          image_url: imageUrl,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        throw new Error("Failed to create community")
      }

      // Add creator as a member
      await supabase.from("community_members").insert({
        community_id: community.id,
        user_id: user.id,
      })

      toast({
        title: "Community created",
        description: "Your community has been created successfully",
      })

      router.push(`/communities/${community.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create community. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Community</CardTitle>
          <CardDescription>Create a new community to connect with others</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Community Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter community name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what your community is about"
                rows={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Community Image (Optional)</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
              {image && <p className="text-sm text-muted-foreground">Selected: {image.name}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Community"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
