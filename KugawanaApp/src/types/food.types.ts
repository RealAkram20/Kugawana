export interface FoodCategory {
  id: number
  name: string
}

export interface FoodListing {
  id: number
  title: string
  description: string | null
  quantity: string
  category: FoodCategory | null
  images: string[]
  points_required: number
  pickup_address: string | null
  expiry_date: string
  donor_name: string | null
  status: string
}

export interface FoodFilters {
  category_id?: number
  search?: string
}

export interface DonationForm {
  title: string
  description: string
  food_category_id: number
  quantity: string
  pickup_address: string
  contact_number: string
  expiry_date: string
}
