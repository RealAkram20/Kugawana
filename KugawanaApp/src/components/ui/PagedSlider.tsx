import { ReactNode, useMemo, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

interface PagedSliderProps<T> {
  data: T[]
  /** Width of one page — normally the padded content width of the screen. */
  slideWidth: number
  keyExtractor: (item: T) => string
  renderItem: (item: T) => ReactNode
  /** Cards shown side by side on a single page. */
  perSlide?: number
  gap?: number
}

/**
 * A horizontal carousel that snaps a whole page at a time rather than drifting
 * mid-card, with a dot for each page. Pages are all the same width, so it lands
 * cleanly on any screen size.
 */
export function PagedSlider<T>({
  data,
  slideWidth,
  keyExtractor,
  renderItem,
  perSlide = 1,
  gap = spacing.sm,
}: PagedSliderProps<T>) {
  const [slide, setSlide] = useState(0)

  const slides = useMemo(
    () =>
      Array.from({ length: Math.ceil(data.length / perSlide) }, (_, index) =>
        data.slice(index * perSlide, index * perSlide + perSlide)
      ),
    [data, perSlide]
  )

  if (slides.length === 0) return null

  const itemWidth = (slideWidth - gap * (perSlide - 1)) / perSlide

  return (
    <View>
      <FlatList
        data={slides}
        keyExtractor={(group) => keyExtractor(group[0])}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setSlide(Math.round(event.nativeEvent.contentOffset.x / slideWidth))
        }
        // Uniform pages, so the list can jump to an offset without measuring.
        getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
        renderItem={({ item: group }) => (
          <View style={[styles.slide, { width: slideWidth, gap }]}>
            {group.map((item) => (
              <View key={keyExtractor(item)} style={{ width: itemWidth }}>
                {renderItem(item)}
              </View>
            ))}
          </View>
        )}
      />
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View key={index} style={[styles.dot, index === slide && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  slide: {
    flexDirection: 'row',
  },
  dots: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
})
