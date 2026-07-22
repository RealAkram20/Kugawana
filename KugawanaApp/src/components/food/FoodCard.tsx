import { Image } from 'expo-image'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import type { FoodListing } from '../../types/food.types'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

interface FoodCardProps {
  food: FoodListing
  onPress: () => void
}

export function FoodCard({ food, onPress }: FoodCardProps) {
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.imageWrap}>
        {food.images.length > 0 ? (
          <Image source={{ uri: food.images[0] }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{food.title.slice(0, 1)}</Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{food.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {food.category?.name ?? ''} · {food.quantity}
        </Text>
        <View style={styles.footer}>
          <Badge label={`${food.points_required} pts`} tone="accent" />
          <Text style={styles.address} numberOfLines={1}>{food.pickup_address ?? ''}</Text>
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageWrap: {
    height: 140,
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
    padding: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  address: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
  },
})
