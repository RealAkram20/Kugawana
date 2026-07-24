import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { CartButton } from '../../../components/CartButton'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { ordersService } from '../../../services/orders.service'

export default function EditRequestScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const orderId = Number(id)

  const { data: order } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getOrder(orderId),
  })

  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!order) return
    setQuantity(order.preferred_quantity ?? order.food?.quantity ?? '')
    setNotes(order.notes ?? '')
  }, [order])

  const save = useMutation({
    mutationFn: () =>
      ordersService.updateOrder(orderId, {
        preferred_quantity: quantity.trim(),
        notes: notes.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      Alert.alert(t('common.appName'), t('requestDetail.saved'))
      if (router.canGoBack()) router.back()
    },
    onError: (error: any) =>
      Alert.alert(t('common.appName'), error.response?.data?.message ?? t('requestDetail.saveFailed')),
  })

  if (!order) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ headerShown: true, title: t('requestDetail.editRequest'), headerRight: () => <CartButton /> }} />
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('requestDetail.editRequest'), headerRight: () => <CartButton /> }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('requestDetail.preferredQuantity')}</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder={order.food?.quantity ?? ''}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>{t('requestDetail.specialNotes')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('requestDetail.notesPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={save.isPending}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, save.isPending && styles.disabled]}
            onPress={() => save.mutate()}
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
  content: {
    padding: spacing.md,
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
    minHeight: 120,
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
