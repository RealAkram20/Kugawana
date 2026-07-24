import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CartButton } from '../../components/CartButton'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'
import { ordersService } from '../../services/orders.service'
import { useAuthStore } from '../../stores/auth.store'
import { useCartStore } from '../../stores/cart.store'

export default function FoodDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const addToCart = useCartStore((state) => state.add)
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [units, setUnits] = useState(1)

  const { data: food } = useQuery({
    queryKey: ['food', Number(id)],
    queryFn: () => foodService.getListing(Number(id)),
  })

  // A whole batch always goes as one piece; a split one is capped by what is
  // left on the shelf.
  const maxUnits = food?.is_split ? Math.max(1, food.units_available ?? 1) : 1
  const claimed = Math.min(units, maxUnits)
  const totalPoints = (food?.points_required ?? 0) * claimed

  const request = useMutation({
    mutationFn: () => ordersService.placeOrder(Number(id), method, undefined, claimed),
    onSuccess: () => {
      if (user && food) {
        // Clamped, because this cached copy is only a guess until the wallet
        // query below comes back with what the server actually charged.
        setUser({ ...user, wallet_balance: Math.max(0, user.wallet_balance - totalPoints) })
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['food'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      Alert.alert(t('common.appName'), t('food.requested'))
      router.back()
    },
    onError: (error: any) => {
      const message = error.response?.status === 422
        ? error.response?.data?.message ?? t('food.notEnoughPoints')
        : t('food.notEnoughPoints')
      Alert.alert(t('common.appName'), message)
    },
  })

  if (!food) return <View style={styles.container} />

  const addBasket = () => {
    addToCart({
      foodId: food.id,
      title: food.title,
      image: food.images[0] ?? null,
      isSplit: food.is_split,
      unitLabel: food.is_split ? food.unit_quantity ?? food.quantity : food.quantity,
      unitPoints: food.points_required,
      maxUnits: maxUnits,
      units: claimed,
      donorName: food.donor_name,
    })
    Alert.alert(t('common.appName'), t('cart.added', { title: food.title }))
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ headerShown: true, title: t('food.detail'), headerRight: () => <CartButton /> }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {food.images.length > 0 ? (
          <Image source={{ uri: food.images[0] }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>{food.title.slice(0, 1)}</Text>
          </View>
        )}

        <View style={styles.head}>
          <Text style={styles.title}>{food.title}</Text>
          <Badge
            label={
              food.is_split
                ? t('food.pointsPerUnit', { points: food.points_required })
                : `${food.points_required} ${t('common.points')}`
            }
            tone="accent"
          />
        </View>
        <Text style={styles.meta}>
          {food.category?.name ?? ''} ·{' '}
          {food.is_split ? t('food.perUnit', { size: food.unit_quantity }) : food.quantity}
        </Text>

        {food.is_split ? (
          <Text style={styles.stock}>
            {t('food.unitsLeft', { available: food.units_available, total: food.units_total })}
          </Text>
        ) : null}

        {food.description ? <Text style={styles.description}>{food.description}</Text> : null}

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.donor')}</Text>
            <Text style={styles.infoValue}>{food.donor_name ?? ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.expiry')}</Text>
            <Text style={styles.infoValue}>{new Date(food.expiry_date).toLocaleString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.pickup')}</Text>
            <Text style={styles.infoValue}>{food.pickup_address ?? ''}</Text>
          </View>
        </Card>

        <View style={styles.methodRow}>
          <Pressable
            onPress={() => setMethod('pickup')}
            style={[styles.method, method === 'pickup' && styles.methodActive]}
          >
            <Text style={[styles.methodLabel, method === 'pickup' && styles.methodLabelActive]}>
              {t('food.pickup')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMethod('delivery')}
            style={[styles.method, method === 'delivery' && styles.methodActive]}
          >
            <Text style={[styles.methodLabel, method === 'delivery' && styles.methodLabelActive]}>
              {t('food.delivery')}
            </Text>
          </Pressable>
        </View>

        {food.is_split ? (
          <Card style={styles.unitCard}>
            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>{t('food.howMuch')}</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setUnits((value) => Math.max(1, value - 1))}
                  disabled={claimed <= 1}
                  style={[styles.step, claimed <= 1 && styles.stepDisabled]}
                  accessibilityLabel={t('food.fewerUnits')}
                >
                  <Text style={styles.stepText}>−</Text>
                </Pressable>
                <Text style={styles.stepValue}>{claimed}</Text>
                <Pressable
                  onPress={() => setUnits((value) => Math.min(maxUnits, value + 1))}
                  disabled={claimed >= maxUnits}
                  style={[styles.step, claimed >= maxUnits && styles.stepDisabled]}
                  accessibilityLabel={t('food.moreUnits')}
                >
                  <Text style={styles.stepText}>+</Text>
                </Pressable>
              </View>
            </View>
            <Text style={styles.unitTotal}>
              {t('food.youReceive', {
                amount: claimed * (food.unit_amount ?? 0),
                unit: food.unit?.symbol ?? '',
                points: totalPoints,
              })}
            </Text>
          </Card>
        ) : null}

        <View style={styles.actions}>
          <Button label={t('cart.addToBasket')} variant="secondary" onPress={addBasket} />
          <Button label={t('food.request')} onPress={() => request.mutate()} loading={request.isPending} />
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  placeholder: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.surface,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  stock: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  unitCard: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  unitLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  step: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepDisabled: {
    opacity: 0.4,
  },
  stepText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stepValue: {
    minWidth: 32,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  unitTotal: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  method: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  methodActive: {
    borderColor: colors.primary,
    backgroundColor: '#EDF5ED',
  },
  methodLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  methodLabelActive: {
    color: colors.primary,
  },
})
