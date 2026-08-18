import { useQuery } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { supportService, toParagraphs } from '../../services/support.service'

export default function FaqScreen() {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState<number | null>(null)

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['support'],
    queryFn: () => supportService.overview(),
  })

  const toggle = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('profile.faq') }} />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {(data?.faqs.length ?? 0) === 0 ? (
            <Text style={styles.empty}>{t('help.faqEmpty')}</Text>
          ) : (
            data!.faqs.map((faq) => {
              const open = openId === faq.id
              return (
                <View key={faq.id} style={styles.card}>
                  <Pressable
                    style={({ pressed }) => [styles.question, pressed && styles.pressed]}
                    onPress={() => toggle(faq.id)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.questionText}>{faq.question}</Text>
                    {open ? (
                      <ChevronUp size={20} color={colors.textSecondary} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={20} color={colors.textMuted} strokeWidth={2} />
                    )}
                  </Pressable>

                  {open ? (
                    <View style={styles.answer}>
                      {toParagraphs(faq.answer).map((paragraph, index) => (
                        <Text key={index} style={styles.answerText}>
                          {paragraph}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              )
            })
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  answer: {
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
