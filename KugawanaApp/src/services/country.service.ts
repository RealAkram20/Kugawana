import { api } from './api'

export interface OperatingCountry {
  id: number
  code: string
  name: string
  currency_code: string | null
}

export const countryService = {
  async list(): Promise<OperatingCountry[]> {
    const { data } = await api.get('/countries')
    return data.data
  },
}

/** Match a geocoded ISO code against the countries Kugawana actually operates in. */
export function matchCountry(
  countries: OperatingCountry[] | undefined,
  isoCode: string | null,
): OperatingCountry | undefined {
  if (!isoCode) return undefined
  return countries?.find((country) => country.code.toUpperCase() === isoCode.toUpperCase())
}
