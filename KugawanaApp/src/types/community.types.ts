export interface CommunityPost {
  id: number
  content: string
  images: string[]
  author_name: string
  likes_count: number
  comments_count: number
  liked: boolean
  created_at: string
}

export interface Article {
  id: number
  title: string
  category: string
  content: string
  cover_image: string | null
  created_at: string
}
