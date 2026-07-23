export interface MemberActivity {
  id: number
  title: string
  detail: string
  category_icon: string
  time_ago: string
  status: string
}

export interface MemberListItem {
  id: number
  name: string
  rating: number
  reviews_count: number
  role_label: string
  profile_photo: string | null
}

export interface MemberProfile {
  id: number
  name: string
  role_label: string
  profile_photo: string | null
  rating: number
  reviews_count: number
  location: string
  stats: { posts: number; shared: number; helped: number }
  about: string | null
  recent_activity: MemberActivity[]
}

export interface MemberReview {
  id: number
  stars: number
  comment: string | null
  time_ago: string
  author_name: string | null
  author_photo: string | null
}

export interface MemberReviews {
  rating: number
  reviews_count: number
  reviews: MemberReview[]
}
