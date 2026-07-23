import { Image } from 'expo-image'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import type { FoodListing } from '../../types/food.types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface FoodCardProps {
  food: FoodListing
  onPress: () => void
  /** The grid sets an explicit width so a lone card on the last row keeps its size. */
  style?: ViewStyle
}

export function FoodCard({ food, onPress, style }: FoodCardProps) {
  return (
    <Card onPress={onPress} style={[styles.card, style]}>
      <View style={styles.imageWrap}>
        {food.images.length > 0 ? (
          <Image source={{ uri: food.images[0] }} style={styles.image} contentFit="cover" transition={150} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{food.title.slice(0, 1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {food.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {food.category?.name ?? ''} · {food.quantity}
        </Text>
        <Badge label={`${food.points_required} pts`} tone="accent" />
        <Text style={styles.address} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {food.pickup_address ?? ''}
        </Text>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageWrap: {
    // Square keeps every card in a row the same height whatever the photo is.
    aspectRatio: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  placeholderText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.surface,
  },
  body: {
    padding: spacing.sm + 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  address: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm - 2,
  },
})
