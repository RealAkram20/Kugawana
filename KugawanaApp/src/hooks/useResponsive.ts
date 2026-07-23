import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'

/** Reference device the designs are drawn against (logical px). */
const BASE_SHORT_SIDE = 390
const BASE_HEIGHT = 844

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Scales a design that was drawn for one phone onto every screen we ship to.
 *
 * `s` sizes elements off the narrow edge so a control keeps the same physical
 * size in portrait and landscape, `vs` compresses vertical rhythm on short
 * screens, and `ms` moves type only part of the way so text never balloons.
 */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions()

  return useMemo(() => {
    const shortSide = Math.min(width, height)
    const landscape = width > height
    const tablet = shortSide >= 600

    const sizeScale = clamp(shortSide / BASE_SHORT_SIDE, 0.86, tablet ? 1.3 : 1.12)
    const spaceScale = clamp(height / BASE_HEIGHT, 0.7, 1.2)

    return {
      width,
      height,
      fontScale,
      landscape,
      tablet,
      /** Short phones (Galaxy A0x, older SE) where fixed vertical gaps stop fitting. */
      compact: height < 720,
      /** Element sizes: icons, radii, padding that should feel physically constant. */
      s: (value: number) => Math.round(value * sizeScale),
      /** Vertical rhythm: margins between blocks. */
      vs: (value: number) => Math.round(value * spaceScale),
      /** Type: half-strength scaling so large screens don't get oversized text. */
      ms: (value: number, factor = 0.5) => Math.round(value + (value * sizeScale - value) * factor),
      /** Keeps a phone-shaped column on tablets and unfolded foldables. */
      maxContentWidth: tablet ? 560 : 520,
    }
  }, [width, height, fontScale])
}

export type Responsive = ReturnType<typeof useResponsive>
