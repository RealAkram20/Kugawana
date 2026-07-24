import type { SupportOverview, SupportPage } from '../types/support.types'
import { api } from './api'

export const supportService = {
  async overview(): Promise<SupportOverview> {
    const { data } = await api.get('/support')
    return data.data
  },

  async page(slug: string): Promise<SupportPage> {
    const { data } = await api.get(`/support/pages/${slug}`)
    return data.data
  },

  async report(subject: string, message: string): Promise<void> {
    await api.post('/support/report', { subject, message })
  },
}

/**
 * Support copy is stored as plain text with blank lines between paragraphs —
 * splitting here keeps the spacing the admin typed instead of collapsing it
 * into one wall of text.
 */
export function toParagraphs(body: string): string[] {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}
