import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import { useState } from 'react'
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
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { ordersService } from '../../../services/orders.service'

const STARS = [1, 2, 3, 4, 5]

export default function RateOrderScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const orderId = Number(id)

  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersService.getOrder(orderId),
  })

  const submit = useMutation({
    mutationFn: () => ordersService.rateOrder(orderId, stars, comment.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['member'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
      Alert.alert(t('common.appName'), t('rate.thanks'))
      back()
    },
    onError: (error: any) =>
      Alert.alert(t('common.appName'), error.response?.data?.message ?? t('rate.failed')),
  })

  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile/requests'))

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  const provider = order.provider

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={back}>
          <ArrowLeft size={28} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('rate.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.providerBlock}>
            {provider?.profile_photo ? (
              <Image source={provider.profile_photo} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>
                  {(provider?.name ?? '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.providerName}>{provider?.name ?? ''}</Text>
            <Text style={styles.foodTitle}>{order.food?.title ?? ''}</Text>
          </View>

          <Text style={styles.prompt}>{t('rate.prompt')}</Text>

          <View style={styles.starRow}>
            {STARS.map((value) => {
              const filled = value <= stars
              return (
                <Pressable
                  key={value}
                  hitSlop={6}
                  onPress={() => setStars(value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: filled }}
                  accessibilityLabel={t('rate.starLabel', { count: value })}
                >
                  <Star
                    size={44}
                    color={filled ? colors.accent : colors.border}
                    fill={filled ? colors.accent : 'transparent'}
                    strokeWidth={2}
                  />
                </Pressable>
              )
            })}
          </View>

          {stars > 0 ? <Text style={styles.starCaption}>{t(`rate.scale.${stars}`)}</Text> : null}

          <Text style={styles.label}>{t('rate.commentLabel')}</Text>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder={t('rate.commentPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={stars === 0 || submit.isPending}
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.pressed,
              (stars === 0 || submit.isPending) && styles.disabled,
            ]}
            onPress={() => submit.mutate()}
          >
            {submit.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitLabel}>{t('rate.submit')}</Text>
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 28,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  providerBlock: {
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.background,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.surface,
  },
  providerName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  foodTitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  prompt: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  starCaption: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitBtn: {
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
    opacity: 0.5,
  },
})
