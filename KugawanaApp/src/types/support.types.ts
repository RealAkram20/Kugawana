export interface SupportFaq {
  id: number
  question: string
  answer: string
}

export interface SupportPageLink {
  slug: string
  title: string
}

export interface SupportContact {
  email: string | null
  phone: string | null
  whatsapp: string | null
  hours: string | null
}

export interface SupportOverview {
  intro: string | null
  contact: SupportContact
  faqs: SupportFaq[]
  pages: SupportPageLink[]
}

export interface SupportPage {
  slug: string
  title: string
  body: string
  updated_at: string | null
}
