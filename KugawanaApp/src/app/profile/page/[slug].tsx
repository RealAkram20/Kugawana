import { useQuery } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { supportService, toParagraphs } from '../../../services/support.service'

export default function SupportPageScreen() {
  const { t } = useTranslation()
  const { slug } = useLocalSearchParams<{ slug: string }>()

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['support-page', slug],
    queryFn: () => supportService.page(slug),
    enabled: Boolean(slug),
  })

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ headerShown: true, title: data?.title ?? t('profile.helpTitle') }}
      />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        >
          {data ? (
            <>
              <Text style={styles.title}>{data.title}</Text>
              {data.updated_at ? (
                <Text style={styles.updated}>
                  {t('help.lastUpdated', { date: data.updated_at })}
                </Text>
              ) : null}

              {toParagraphs(data.body).map((paragraph, index) => (
                <Text key={index} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.empty}>{t('help.pageMissing')}</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  updated: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
