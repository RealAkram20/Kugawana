import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CategoryPill } from '../../components/food/CategoryPill'
import { PhotoPicker } from '../../components/food/PhotoPicker'
import { Input } from '../../components/ui/Input'
import { colors } from '../../constants/colors'
import { availableUntilParts } from '../../constants/datetime'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'
import type { PickedImage } from '../../types/food.types'

interface ShareForm {
  title: string
  description: string
  amount: string
  pickup_address: string
  contact_number: string
}

/** Preset windows, so nobody has to hand-type a timestamp. */
const WINDOWS = [
  { key: 'today', hours: 8 },
  { key: 'tomorrow', hours: 24 },
  { key: 'threeDays', hours: 72 },
  { key: 'week', hours: 168 },
] as const

export default function ShareScreen() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const { control, handleSubmit, reset } = useForm<ShareForm>({
    defaultValues: {
      title: '',
      description: '',
      amount: '',
      pickup_address: '',
      contact_number: '',
    },
  })

  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [unitId, setUnitId] = useState<number | null>(null)
  const [images, setImages] = useState<PickedImage[]>([])
  const [windowKey, setWindowKey] = useState<(typeof WINDOWS)[number]['key']>('tomorrow')

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => foodService.getCategories(),
  })

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => foodService.getUnits(),
  })

  const expiryDate = () => {
    const hours = WINDOWS.find((w) => w.key === windowKey)?.hours ?? 24
    return new Date(Date.now() + hours * 60 * 60 * 1000)
  }

  const expiryLabel = () => {
    const parts = availableUntilParts(expiryDate().toISOString(), i18n.language)
    return parts.dayKey
      ? t(`sharedFood.${parts.dayKey}`, { time: parts.time })
      : `${parts.day}, ${parts.time}`
  }

  const donate = useMutation({
    mutationFn: (values: ShareForm) =>
      foodService.donate({
        ...values,
        amount: Number(values.amount.replace(',', '.')),
        unit_id: unitId ?? 0,
        food_category_id: categoryId ?? 0,
        expiry_date: expiryDate().toISOString(),
        images,
      }),
    onSuccess: (created) => {
      reset()
      setCategoryId(null)
      setUnitId(null)
      setImages([])
      setWindowKey('tomorrow')
      queryClient.invalidateQueries({ queryKey: ['my-donations'] })
      queryClient.invalidateQueries({ queryKey: ['food'] })
      Alert.alert(t('common.appName'), t('share.submitted'))
      // Land on the new listing rather than leaving the form sitting there.
      router.push({ pathname: '/food/shared/[id]', params: { id: created.id } })
    },
    onError: (error: any) =>
      Alert.alert(t('common.appName'), error.response?.data?.message ?? t('share.failed')),
  })

  const submit = handleSubmit((values) => {
    if (categoryId == null) {
      Alert.alert(t('common.appName'), t('share.categoryRequired'))
      return
    }
    if (unitId == null) {
      Alert.alert(t('common.appName'), t('share.unitRequired'))
      return
    }
    if (!(Number(values.amount.replace(',', '.')) > 0)) {
      Alert.alert(t('common.appName'), t('share.amountInvalid'))
      return
    }
    donate.mutate(values)
  })

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/share'))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={back}>
          <ArrowLeft size={28} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('share.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input control={control} name="title" label={t('share.foodTitle')} rules={{ required: true }} />

          <Text style={styles.label}>{t('share.category')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pills}
          >
            {(categories ?? []).map((category) => (
              <CategoryPill
                key={category.id}
                label={category.name}
                active={categoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
          </ScrollView>

          <Text style={styles.label}>{t('share.photos')}</Text>
          <PhotoPicker value={images} onChange={setImages} max={5} />

          <Input
            control={control}
            name="amount"
            label={t('share.quantity')}
            rules={{ required: true }}
            keyboardType="decimal-pad"
            placeholder={t('share.amountPlaceholder')}
          />

          <Text style={styles.label}>{t('share.unit')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pills}
          >
            {(units ?? []).map((unit) => (
              <CategoryPill
                key={unit.id}
                label={unit.symbol}
                active={unitId === unit.id}
                onPress={() => setUnitId(unit.id)}
              />
            ))}
          </ScrollView>

          <Text style={styles.label}>{t('share.expiry')}</Text>
          <View style={styles.windowRow}>
            {WINDOWS.map((option) => {
              const active = windowKey === option.key
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setWindowKey(option.key)}
                  style={[styles.window, active && styles.windowActive]}
                >
                  <Text style={[styles.windowLabel, active && styles.windowLabelActive]}>
                    {t(`share.windows.${option.key}`)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          <Text style={styles.expiryHint}>{t('share.availableUntil', { when: expiryLabel() })}</Text>

          <Input
            control={control}
            name="pickup_address"
            label={t('share.pickupAddress')}
            rules={{ required: true }}
          />
          <Input
            control={control}
            name="contact_number"
            label={t('share.contact')}
            keyboardType="phone-pad"
            placeholder={t('editProfile.phonePlaceholder')}
          />
          <Input
            control={control}
            name="description"
            label={t('share.description')}
            multiline
            placeholder={t('share.descriptionPlaceholder')}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={donate.isPending}
            onPress={submit}
            style={({ pressed }) => [
              styles.submit,
              pressed && styles.pressed,
              donate.isPending && styles.disabled,
            ]}
          >
            {donate.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitLabel}>{t('share.submit')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  pills: {
    paddingRight: spacing.md,
  },
  windowRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  window: {
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 21,
    backgroundColor: '#F2F2EF',
  },
  windowActive: {
    backgroundColor: colors.primary,
  },
  windowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  windowLabelActive: {
    color: colors.surface,
  },
  expiryHint: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  submit: {
    height: 58,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
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
