import { router } from 'expo-router'
import { ShoppingBasket } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../constants/colors'
import { useCartStore, cartCount } from '../stores/cart.store'

/** Header basket button with a live count badge; hidden when the basket is empty. */
export function CartButton() {
  const items = useCartStore((state) => state.items)
  const count = cartCount(items)

  return (
    <Pressable
      onPress={() => router.push('/cart')}
      style={styles.button}
      hitSlop={8}
      accessibilityLabel="Open basket"
    >
      <ShoppingBasket size={24} color={colors.textPrimary} strokeWidth={2} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: 0,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.surface,
  },
})
