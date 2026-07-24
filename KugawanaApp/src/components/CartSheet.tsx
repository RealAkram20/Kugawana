import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Minus, Plus, ShoppingBasket, Trash2, X } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import { ordersService } from '../services/orders.service'
import { useAuthStore } from '../stores/auth.store'
import { cartCount, cartTotalPoints, useCartStore } from '../stores/cart.store'
import type { CheckoutNote } from '../types/cart.types'

/** The slide-in basket popup, mounted once at the root so any screen's basket
 * button can open it. */
export function CartSheet() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const open = useCartStore((state) => state.open)
  const close = useCartStore((state) => state.closeCart)
  const items = useCartStore((state) => state.items)
  const setUnits = useCartStore((state) => state.setUnits)
  const remove = useCartStore((state) => state.remove)
  const removeMany = useCartStore((state) => state.removeMany)
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [address, setAddress] = useState('')

  const total = cartTotalPoints(items)
  const count = cartCount(items)

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
      // Clamped, because this cached copy is only a guess until the wallet query
      // below comes back with what the server actually charged.
      if (user && spent > 0) {
        setUser({ ...user, wallet_balance: Math.max(0, user.wallet_balance - spent) })
      }

      // Keep only the skipped lines; anything placed or reduced leaves the basket.
      const skippedIds = result.skipped.map((note) => note.food_donation_id)
      removeMany(items.map((line) => line.foodId).filter((id) => !skippedIds.includes(id)))

      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['food'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })

      const notices = [...result.adjusted.map(noticeFor), ...result.skipped.map(noticeFor)].filter(Boolean)
      const placedCount = result.placed.length
      const summary = [
        placedCount > 0 ? t('cart.placedCount', { count: placedCount }) : t('cart.nonePlaced'),
        ...notices,
      ].join('\n')

      Alert.alert(t('common.appName'), summary, [
        {
          text: t('common.continue'),
          onPress: () => {
            close()
            if (placedCount > 0) router.push('/profile/requests')
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

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <Pressable style={styles.panel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{t('cart.yourCart')}</Text>
                <Text style={styles.subtitle}>{t('cart.itemsCount', { count })}</Text>
              </View>
              <View style={styles.headerRight}>
                <Text style={styles.headerTotal}>
                  {total} {t('common.points')}
                </Text>
                <Pressable hitSlop={10} onPress={close}>
                  <X size={22} color={colors.textPrimary} strokeWidth={2.2} />
                </Pressable>
              </View>
            </View>

            {items.length === 0 ? (
              <View style={styles.empty}>
                <ShoppingBasket size={44} color={colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyText}>{t('cart.empty')}</Text>
              </View>
            ) : (
              <>
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                  {items.map((line) => {
                    const lineTotal = line.unitPoints * line.units
                    return (
                      <View key={line.foodId} style={styles.row}>
                        <View>
                          {line.image ? (
                            <Image source={line.image} style={styles.thumb} contentFit="cover" transition={120} />
                          ) : (
                            <View style={[styles.thumb, styles.thumbFallback]}>
                              <Text style={styles.thumbText}>{line.title.slice(0, 1).toUpperCase()}</Text>
                            </View>
                          )}
                          <View style={styles.qtyBadge}>
                            <Text style={styles.qtyBadgeText}>{line.units}</Text>
                          </View>
                        </View>

                        <View style={styles.rowBody}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {line.title}
                          </Text>
                          <Text style={styles.rowMeta} numberOfLines={1}>
                            {line.isSplit
                              ? t('cart.perUnitPoints', { size: line.unitLabel, points: line.unitPoints })
                              : `${line.unitLabel} · ${line.unitPoints} ${t('common.points')}`}
                          </Text>
                          <Text style={styles.rowTotal}>
                            {lineTotal} {t('common.points')}
                          </Text>
                        </View>

                        <View style={styles.rowActions}>
                          {line.isSplit ? (
                            <View style={styles.stepper}>
                              <Pressable
                                onPress={() => setUnits(line.foodId, line.units - 1)}
                                disabled={line.units <= 1}
                                style={[styles.step, line.units <= 1 && styles.stepDisabled]}
                              >
                                <Minus size={15} color={colors.textPrimary} />
                              </Pressable>
                              <Text style={styles.stepValue}>{line.units}</Text>
                              <Pressable
                                onPress={() => setUnits(line.foodId, line.units + 1)}
                                disabled={line.units >= line.maxUnits}
                                style={[styles.step, line.units >= line.maxUnits && styles.stepDisabled]}
                              >
                                <Plus size={15} color={colors.textPrimary} />
                              </Pressable>
                            </View>
                          ) : (
                            <Text style={styles.wholeLabel}>{t('cart.wholeItem')}</Text>
                          )}
                          <Pressable onPress={() => remove(line.foodId)} hitSlop={8} style={styles.trash}>
                            <Trash2 size={17} color={colors.textMuted} />
                          </Pressable>
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
                  <Pressable
                    style={({ pressed }) => [styles.checkout, pressed && styles.checkoutPressed, checkout.isPending && styles.checkoutDisabled]}
                    disabled={checkout.isPending}
                    onPress={submit}
                  >
                    <Text style={styles.checkoutLabel}>{t('cart.checkout')}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  safe: {
    flex: 1,
    // Dock the panel to the right, like a slide-in cart drawer.
    alignItems: 'flex-end',
  },
  panel: {
    width: '88%',
    maxWidth: 420,
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerTotal: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  thumbText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.surface,
  },
  qtyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.surface,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  rowTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  rowActions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 8,
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
    minWidth: 22,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  wholeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  trash: {
    padding: 2,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
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
    fontWeight: '800',
    color: colors.textPrimary,
  },
  checkout: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutPressed: {
    opacity: 0.85,
  },
  checkoutDisabled: {
    opacity: 0.6,
  },
  checkoutLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
})
