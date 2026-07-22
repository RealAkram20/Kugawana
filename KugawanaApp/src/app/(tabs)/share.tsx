import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CategoryPill } from '../../components/food/CategoryPill'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'

interface ShareForm {
  title: string
  description: string
  quantity: string
  pickup_address: string
  contact_number: string
  expiry_date: string
}

export default function ShareScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { control, handleSubmit, reset } = useForm<ShareForm>({
    defaultValues: { title: '', description: '', quantity: '', pickup_address: '', contact_number: '', expiry_date: '' },
  })
  const [categoryId, setCategoryId] = useState<number | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => foodService.getCategories(),
  })

  const donate = useMutation({
    mutationFn: (values: ShareForm) =>
      foodService.donate({ ...values, food_category_id: categoryId ?? 0 }),
    onSuccess: () => {
      reset()
      setCategoryId(null)
      queryClient.invalidateQueries({ queryKey: ['my-donations'] })
      Alert.alert(t('common.appName'), t('share.submitted'))
    },
    onError: (error: any) => {
      Alert.alert(t('common.appName'), error.response?.data?.message ?? 'Could not submit. Try again.')
    },
  })

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('share.title')}</Text>

        <Input control={control} name="title" label={t('share.foodTitle')} rules={{ required: true }} />
        <Input control={control} name="description" label={t('share.description')} multiline numberOfLines={3} />

        <Text style={styles.label}>{t('share.category')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills}>
          {(categories ?? []).map((category) => (
            <CategoryPill
              key={category.id}
              label={category.name}
              active={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </ScrollView>

        <Input control={control} name="quantity" label={t('share.quantity')} rules={{ required: true }} />
        <Input control={control} name="pickup_address" label={t('share.pickupAddress')} rules={{ required: true }} />
        <Input control={control} name="contact_number" label={t('share.contact')} keyboardType="phone-pad" />
        <Input control={control} name="expiry_date" label={t('share.expiry')} placeholder="2026-07-30 18:00" rules={{ required: true }} />

        <Button
          label={t('share.submit')}
          onPress={handleSubmit((values) => donate.mutate(values))}
          loading={donate.isPending}
          disabled={categoryId == null}
        />
        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  pills: {
    marginBottom: spacing.md,
  },
  bottomPad: {
    height: spacing.xl,
  },
})
