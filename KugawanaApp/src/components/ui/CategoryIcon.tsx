import {
  Apple,
  Baby,
  Carrot,
  CookingPot,
  Croissant,
  CupSoda,
  Salad,
  Snowflake,
  Utensils,
  Wheat,
} from 'lucide-react-native'
import { StyleSheet, View } from 'react-native'
import { colors } from '../../constants/colors'

/** Slugs come from MemberController::CATEGORY_ICONS. */
const ICONS = {
  salad: Salad,
  snowflake: Snowflake,
  wheat: Wheat,
  'cooking-pot': CookingPot,
  'cup-soda': CupSoda,
  croissant: Croissant,
  baby: Baby,
  carrot: Carrot,
  apple: Apple,
  utensils: Utensils,
} as const

export type CategoryIconSlug = keyof typeof ICONS

interface CategoryIconProps {
  slug: string
  size?: number
}

/** Food-category glyph in a soft tile, used wherever a listing is summarised. */
export function CategoryIcon({ slug, size = 24 }: CategoryIconProps) {
  const Icon = ICONS[slug as CategoryIconSlug] ?? Utensils

  return (
    <View style={styles.tile}>
      <Icon size={size} color={colors.primary} strokeWidth={2} />
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F1E4',
  },
})
