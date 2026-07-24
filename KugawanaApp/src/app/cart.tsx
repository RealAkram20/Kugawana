import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack } from 'expo-router'
import { Minus, Plus, ShoppingBasket, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Button } from '../components/ui/Button'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import { ordersService } from '../services/orders.service'
import { useAuthStore } from '../stores/auth.store'
import { cartTotalPoints, useCartStore } from '../stores/cart.store'
import type { CheckoutNote } from '../types/cart.types'

export default function CartScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const items = useCartStore((state) => state.items)
  const setUnits = useCartStore((state) => state.setUnits)
  const remove = useCartStore((state) => state.remove)
  const removeMany = useCartStore((state) => state.removeMany)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')

  const total = cartTotalPoints(items)

  const noticeFor = (note: CheckoutNote): string => {
    switch (note.reason) {
      case 'reduced':
        return t('cart.reasonReduced', { title: note.title, placed: note.placed, requested: note.requested })
      case 'sold_out':
        return t('cart.reasonSoldOut', { title: note.title })
      case 'unavailable':
        return t('cart.reasonUnavailable', { title: note.title })
      case 'insufficient_points':
        return t('cart.reasonPoints', { title: note.title })
      default:
        return ''
    }
  }

  const checkout = useMutation({
    mutationFn: () =>
      ordersService.checkout({
        delivery_method: method,
        delivery_address: method === 'delivery' ? address.trim() : undefined,
        items: items.map((line) => ({ food_donation_id: line.foodId, units: line.units })),
      }),
    onSuccess: (result) => {
      const spent = result.placed.reduce((sum, order) => sum + order.points_spent, 0)
      if (user && spent > 0) setUser({ ...user, wallet_balance: user.wallet_balance - spent })

      // Keep only the lines that were skipped; everything placed or reduced leaves the basket.
      const skippedIds = result.skipped.map((note) => note.food_donation_id)
      removeMany(items.map((line) => line.foodId).filter((id) => !skippedIds.includes(id)))

      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['food'] })

      const notices = [
        ...result.adjusted.map(noticeFor),
        ...result.skipped.map(noticeFor),
      ].filter(Boolean)

      const placedCount = result.placed.length
      const summary = [
        placedCount > 0 ? t('cart.placedCount', { count: placedCount }) : t('cart.nonePlaced'),
        ...notices,
      ].join('\n')

      Alert.alert(t('common.appName'), summary, [
        {
          text: t('common.continue'),
          onPress: () => {
            if (placedCount > 0) router.replace('/profile/requests')
          },
        },
      ])
    },
    onError: () => Alert.alert(t('common.appName'), t('cart.checkoutFailed')),
  })

  const submit = () => {
    if (method === 'delivery' && !address.trim()) {
      Alert.alert(t('common.appName'), t('cart.addressRequired'))
      return
    }
    checkout.mutate()
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: t('cart.title') }} />
        <View style={styles.empty}>
          <ShoppingBasket size={48} color={colors.textMuted} strokeWidth={1.5} />
          <Text style={styles.emptyText}>{t('cart.empty')}</Text>
          <Button label={t('food.browse')} onPress={() => router.replace('/food')} />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('cart.title') }} />
      <ScrollView contentContainerStyle={styles.content}>
        {items.map((line) => {
          const lineTotal = line.unitPoints * line.units
          return (
            <View key={line.foodId} style={styles.card}>
              {line.image ? (
                <Image source={line.image} style={styles.thumb} contentFit="cover" transition={120} />
              ) : (
                <View style={[styles.thumb, styles.thumbFallback]}>
                  <Text style={styles.thumbText}>{line.title.slice(0, 1).toUpperCase()}</Text>
                </View>
              )}

              <View style={styles.lineBody}>
                <View style={styles.lineTop}>
                  <Text style={styles.lineTitle} numberOfLines={1}>
                    {line.title}
                  </Text>
                  <Pressable onPress={() => remove(line.foodId)} hitSlop={8}>
                    <Trash2 size={18} color={colors.textMuted} />
                  </Pressable>
                </View>

                <Text style={styles.lineMeta}>
                  {line.isSplit
                    ? t('cart.perUnitPoints', { size: line.unitLabel, points: line.unitPoints })
                    : `${line.unitLabel} · ${line.unitPoints} ${t('common.points')}`}
                </Text>

                <View style={styles.lineBottom}>
                  {line.isSplit ? (
                    <View style={styles.stepper}>
                      <Pressable
                        onPress={() => setUnits(line.foodId, line.units - 1)}
                        disabled={line.units <= 1}
                        style={[styles.step, line.units <= 1 && styles.stepDisabled]}
                      >
                        <Minus size={16} color={colors.textPrimary} />
                      </Pressable>
                      <Text style={styles.stepValue}>{line.units}</Text>
                      <Pressable
                        onPress={() => setUnits(line.foodId, line.units + 1)}
                        disabled={line.units >= line.maxUnits}
                        style={[styles.step, line.units >= line.maxUnits && styles.stepDisabled]}
                      >
                        <Plus size={16} color={colors.textPrimary} />
                      </Pressable>
                    </View>
                  ) : (
                    <Text style={styles.wholeLabel}>{t('cart.wholeItem')}</Text>
                  )}
                  <Text style={styles.lineTotal}>
                    {lineTotal} {t('common.points')}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}

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

        {method === 'delivery' ? (
          <TextInput
            style={styles.address}
            value={address}
            onChangeText={setAddress}
            placeholder={t('cart.addressPlaceholder')}
            placeholderTextColor={colors.textMuted}
          />
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('cart.total')}</Text>
          <Text style={styles.totalValue}>
            {total} {t('common.points')}
          </Text>
        </View>
        <Button
          label={t('cart.checkout')}
          onPress={submit}
          loading={checkout.isPending}
        />
      </View>
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
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  thumbText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.surface,
  },
  lineBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  lineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  lineTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  lineMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lineBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  step: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepDisabled: {
    opacity: 0.4,
  },
  stepValue: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  wholeLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  lineTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  address: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
})
