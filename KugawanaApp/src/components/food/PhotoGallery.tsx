import { Image } from 'expo-image'
import { useWindowDimensions } from 'react-native'
import { spacing } from '../../constants/spacing'
import { PagedSlider } from '../ui/PagedSlider'

interface PhotoGalleryProps {
  images: string[]
  height?: number
  borderRadius?: number
}

/**
 * Swipeable photo gallery for a listing's images, one photo per page with the
 * slider's dots underneath. Sized to the screen's padded content width
 * (spacing.md gutters), so it drops into any detail ScrollView as a drop-in
 * replacement for the old single hero image.
 */
export function PhotoGallery({ images, height = 220, borderRadius = 16 }: PhotoGalleryProps) {
  const { width } = useWindowDimensions()
  const slideWidth = width - spacing.md * 2

  return (
    <PagedSlider
      data={images}
      slideWidth={slideWidth}
      keyExtractor={(uri) => uri}
      renderItem={(uri) => (
        <Image
          source={{ uri }}
          style={{ width: '100%', height, borderRadius }}
          contentFit="cover"
          transition={150}
        />
      )}
    />
  )
}
