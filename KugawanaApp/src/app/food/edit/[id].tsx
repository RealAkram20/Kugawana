import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Lock } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { CategoryPill } from '../../../components/food/CategoryPill'
import { PhotoPicker } from '../../../components/food/PhotoPicker'
import { CartButton } from '../../../components/CartButton'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { foodService } from '../../../services/food.service'
import type { PickedImage } from '../../../types/food.types'

export default function EditDonationScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const foodId = Number(id)

  const { data: food } = useQuery({
    queryKey: ['food', foodId],
    queryFn: () => foodService.getListing(foodId),
  })

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => foodService.getUnits(),
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [unitId, setUnitId] = useState<number | null>(null)
  const [pickup, setPickup] = useState('')
  const [images, setImages] = useState<PickedImage[]>([])

  // Seed the form once the listing arrives.
  useEffect(() => {
    if (!food) return
    setTitle(food.title)
    setDescription(food.description ?? '')
    setAmount(String(food.amount))
    setUnitId(food.unit?.id ?? null)
    setPickup(food.pickup_address ?? '')
  }, [food])

  const save = useMutation({
    mutationFn: () =>
      foodService.updateDonation(foodId, {
        title: title.trim(),
        description: description.trim(),
        amount: Number(amount.replace(',', '.')),
        unit_id: unitId ?? undefined,
        pickup_address: pickup.trim(),
        images,
      }),
    onSuccess: () => {
      setImages([])
      queryClient.invalidateQueries({ queryKey: ['food', foodId] })
      queryClient.invalidateQueries({ queryKey: ['my-donations'] })
      Alert.alert(t('common.appName'), t('sharedFood.saved'))
      if (router.canGoBack()) router.back()
    },
    onError: (error: any) =>
      Alert.alert(t('common.appName'), error.response?.data?.message ?? t('sharedFood.saveFailed')),
  })

  const submit = () => {
    if (!title.trim() || !pickup.trim() || unitId == null || !(Number(amount.replace(',', '.')) > 0)) {
      Alert.alert(t('common.appName'), t('sharedFood.requiredFields'))
      return
    }
    save.mutate()
  }

  if (!food) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ headerShown: true, title: t('sharedFood.edit'), headerRight: () => <CartButton /> }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  // Reachable from a deep link or a screen opened before the admin approved it.
  if (!food.can_edit) {
    return (
      <View style={styles.locked}>
        <Stack.Screen options={{ headerShown: true, title: t('sharedFood.edit'), headerRight: () => <CartButton /> }} />
        <Lock size={32} color={colors.textMuted} strokeWidth={2} />
        <Text style={styles.lockedText}>{t('sharedFood.handedOver')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('sharedFood.edit'), headerRight: () => <CartButton /> }} />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('share.foodTitle')}</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />

          <Text style={styles.label}>{t('share.photos')}</Text>
          <PhotoPicker value={images} onChange={setImages} existing={food.images} max={5} />

          <Text style={styles.label}>{t('food.quantity')}</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder={t('share.amountPlaceholder')}
          />

          <Text style={styles.label}>{t('share.unit')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
            {(units ?? []).map((unit) => (
              <CategoryPill
                key={unit.id}
                label={unit.symbol}
                active={unitId === unit.id}
                onPress={() => setUnitId(unit.id)}
              />
            ))}
          </ScrollView>

          <Text style={styles.label}>{t('sharedFood.pickupLocation')}</Text>
          <TextInput style={styles.input} value={pickup} onChangeText={setPickup} />

          <Text style={styles.label}>{t('share.description')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, save.isPending && styles.disabled]}
            disabled={save.isPending}
            onPress={submit}
          >
            {save.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.saveLabel}>{t('sharedFood.save')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
  },
  lockedText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textarea: {
    minHeight: 110,
  },
  pills: {
    paddingRight: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
})
