import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'
import { ordersService } from '../../services/orders.service'
import { useAuthStore } from '../../stores/auth.store'

export default function FoodDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [method, setMethod] = useState<'pickup' | 'delivery'>('pickup')

  const { data: food } = useQuery({
    queryKey: ['food', Number(id)],
    queryFn: () => foodService.getListing(Number(id)),
  })

  const request = useMutation({
    mutationFn: () => ordersService.placeOrder(Number(id), method),
    onSuccess: () => {
      if (user && food) {
        setUser({ ...user, wallet_balance: user.wallet_balance - food.points_required })
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['food'] })
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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('food.detail') }} />
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
          <Badge label={`${food.points_required} ${t('common.points')}`} tone="accent" />
        </View>
        <Text style={styles.meta}>
          {food.category?.name ?? ''} · {food.quantity}
        </Text>

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

        <Button label={t('food.request')} onPress={() => request.mutate()} loading={request.isPending} />
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
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
