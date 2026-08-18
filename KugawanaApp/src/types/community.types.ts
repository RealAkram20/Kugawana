import type { PickedImage } from './food.types'

export type PostType = 'request' | 'offer' | 'discussion'

export type FeedFilter = 'all' | PostType

export interface CommunityPost {
  id: number
  content: string
  post_type: PostType | null
  location: string | null
  images: string[]
  author_id: number
  author_name: string
  profile_photo: string | null
  likes_count: number
  comments_count: number
  liked: boolean
  time_ago: string
  created_at: string
}

export interface CreatePostPayload {
  content: string
  post_type: PostType
  location?: string
  images?: PickedImage[]
}

export interface CommunityComment {
  id: number
  /** null for a thread starter; the comment it answers otherwise. */
  parent_id: number | null
  author_id: number
  author_name: string
  profile_photo: string | null
  content: string
  /** Only ever set on thread starters — threads are two levels deep. */
  replies_count: number
  time_ago: string
}

export interface CommunityPostDetail {
  id: number
  author_id: number
  author_name: string
  profile_photo: string | null
  content: string
  images: string[]
  post_type: PostType | null
  location: string | null
  time_ago: string
  likes_count: number
  comments_count: number
  liked: boolean
  comments: CommunityComment[]
}

export interface Article {
  id: number
  title: string
  category: string
  content: string
  cover_image: string | null
  created_at: string
}
