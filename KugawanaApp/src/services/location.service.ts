import * as Location from 'expo-location'
import { Platform } from 'react-native'

export interface ResolvedPlace {
  /** ISO 3166-1 alpha-2, e.g. "UG". Null when the geocoder could not name a country. */
  isoCountryCode: string | null
  countryName: string | null
  /** Best available administrative area below country — what Kugawana calls a district. */
  district: string | null
  /** A street-level line suitable for the address field. */
  address: string | null
  latitude: number
  longitude: number
  /**
   * False when we fixed the coordinates but the geocoder gave nothing back, so
   * callers can say "we found you but could not name the place" instead of
   * silently filling nothing in.
   */
  geocoded: boolean
}

export class LocationDeniedError extends Error {
  constructor() {
    super('Location permission denied')
    this.name = 'LocationDeniedError'
  }
}

/** The device-wide location toggle is off — permission alone cannot fix this. */
export class LocationServicesOffError extends Error {
  constructor() {
    super('Location services are turned off')
    this.name = 'LocationServicesOffError'
  }
}

/** Permission and services are fine but no position could be fixed. */
export class LocationUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Could not fix a position')
    this.name = 'LocationUnavailableError'
    this.cause = cause
  }
}

/** Street values so generic they tell a member nothing — reject these outright. */
const GENERIC_STREET = /^(unnamed\s+)?(road|street|way|highway|rd|st|avenue|ave)$/i

/**
 * Geocoders disagree about which field carries the town: Android usually fills
 * `subregion`/`city`, iOS leans on `city`/`region`. Take the first that is set so
 * the district field gets something useful either way.
 */
export function pickDistrict(place: Location.LocationGeocodedAddress): string | null {
  return place.district || place.subregion || place.city || place.region || null
}

/**
 * Drop the trailing area segments (town, region, country, postcode) from a
 * comma-joined line, so the address field keeps just the street-level part and
 * does not repeat what the district and country already say.
 */
function trimAreaTail(line: string, place: Location.LocationGeocodedAddress): string {
  const tail = new Set(
    [
      place.city,
      place.subregion,
      place.district,
      place.region,
      place.country,
      place.isoCountryCode,
      place.postalCode,
    ]
      .filter(Boolean)
      .map((value) => value!.toLowerCase()),
  )

  const segments = line.split(',').map((part) => part.trim()).filter(Boolean)

  while (segments.length > 0 && tail.has(segments[segments.length - 1].toLowerCase())) {
    segments.pop()
  }

  return segments.join(', ')
}

/**
 * The most specific street-level line the geocoder can give. Android's
 * `formattedAddress` is the fullest — it is preferred over the raw `street`
 * field, which is often just "Road" while the composed line reads
 * "Plot 45, Kyetume Road". A lone generic word or a value that merely repeats the
 * district is treated as nothing, so the field stays empty for the member to fill
 * rather than showing something useless.
 */
export function pickAddress(place: Location.LocationGeocodedAddress): string | null {
  const district = pickDistrict(place)?.toLowerCase()

  const candidates = [
    place.formattedAddress ? trimAreaTail(place.formattedAddress, place) : null,
    [place.streetNumber, place.street].filter(Boolean).join(' ').trim() || null,
    place.name?.trim() || null,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    if (GENERIC_STREET.test(candidate)) continue
    if (candidate.toLowerCase() === district) continue
    return candidate
  }

  return null
}

/**
 * A fix, however we can get one. `getCurrentPositionAsync` can sit for a long time
 * or reject indoors, so a recent cached fix is a better answer than an error.
 */
async function readPosition(): Promise<Location.LocationObject> {
  // Android only: nudges the user toward high-accuracy mode, which is what makes
  // the network provider available. Declining is fine — the GPS read still runs.
  if (Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync()
    } catch {
      // Declined, or already on. Neither is a reason to stop.
    }
  }

  try {
    return await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
  } catch (error) {
    const cached = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })

    if (cached) {
      return cached
    }

    throw new LocationUnavailableError(error)
  }
}

/**
 * Ask for permission, read the device position, and turn it into the fields the
 * profile and checkout forms need.
 *
 * Failures are separated so callers can say something useful: denial, the device
 * toggle being off, and no-fix-available all need different advice. A geocode that
 * comes back empty is not a failure — the coordinates are still worth keeping.
 */
export async function resolveCurrentPlace(): Promise<ResolvedPlace> {
  const { status } = await Location.requestForegroundPermissionsAsync()

  if (status !== 'granted') {
    throw new LocationDeniedError()
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    throw new LocationServicesOffError()
  }

  const position = await readPosition()
  const { latitude, longitude } = position.coords

  let place: Location.LocationGeocodedAddress | undefined

  try {
    // Geocoding is a separate service from the GPS fix and fails independently —
    // no network, rate limiting, or an unmapped area all land here.
    ;[place] = await Location.reverseGeocodeAsync({ latitude, longitude })
  } catch (error) {
    console.warn('[location] reverse geocode failed', error)
  }

  if (!place) {
    return {
      isoCountryCode: null,
      countryName: null,
      district: null,
      address: null,
      latitude,
      longitude,
      geocoded: false,
    }
  }

  return {
    isoCountryCode: place.isoCountryCode?.toUpperCase() ?? null,
    countryName: place.country ?? null,
    district: pickDistrict(place),
    address: pickAddress(place),
    latitude,
    longitude,
    geocoded: true,
  }
}

/** One line a member can read back, e.g. "Plot 12 Kira Road, Nakawa". */
export function placeSummary(place: ResolvedPlace): string {
  return [place.address, place.district, place.countryName].filter(Boolean).join(', ')
}
