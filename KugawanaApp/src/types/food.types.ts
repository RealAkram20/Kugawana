export interface FoodCategory {
  id: number
  name: string
}

/** Measurement units are managed by admins, so the app never hardcodes them. */
export interface Unit {
  id: number
  name: string
  symbol: string
}

/** A photo chosen from the device library, ready to append to a FormData. */
export interface PickedImage {
  uri: string
  name: string
  type: string
}

export interface InterestedPerson {
  id: number
  name: string
  profile_photo: string | null
}

export interface InterestedRequester extends InterestedPerson {
  district: string | null
  delivery_method: string
  requested_ago: string
}

export interface FoodListing {
  id: number
  title: string
  description: string | null
  /** Preformatted for display, e.g. "2 Kg". */
  quantity: string
  amount: number
  unit: Unit | null
  /** Admins can break a bulk donation into portions people can finish. */
  is_split: boolean
  /** Size of one unit, e.g. 1, with `unit_quantity` the label "1 Kg". */
  unit_amount: number | null
  unit_quantity: string | null
  units_total: number | null
  units_available: number | null
  category: FoodCategory | null
  category_icon: string
  images: string[]
  points_required: number
  pickup_address: string | null
  expiry_date: string
  donor_id: number
  donor_name: string | null
  status: string
  is_active: boolean
  is_owner: boolean
  /** Both go false once an admin approves the food and takes it into the system. */
  can_edit: boolean
  can_complete: boolean
  time_ago: string
  created_at: string
  /** Owner-only: the API omits these entirely for everyone else. */
  interested_count?: number
  interested?: InterestedPerson[]
}

export interface UpdateDonationPayload {
  title?: string
  description?: string
  amount?: number
  unit_id?: number
  pickup_address?: string
  contact_number?: string
  expiry_date?: string
  /** Only send this when replacing the gallery; omitting it leaves photos as they are. */
  images?: PickedImage[]
}

export interface FoodFilters {
  category_id?: number
  search?: string
}

export interface DonationForm {
  title: string
  description: string
  food_category_id: number
  amount: number
  unit_id: number
  pickup_address: string
  contact_number: string
  expiry_date: string
  images: PickedImage[]
}
