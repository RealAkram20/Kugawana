import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Card } from '../../components/ui/Card'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { learnService } from '../../services/learn.service'

export default function LearnScreen() {
  const { t } = useTranslation()
  const { data: articles } = useQuery({
    queryKey: ['learn'],
    queryFn: () => learnService.articles(),
  })

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('learn.title') }} />
      <FlatList
        data={articles ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => router.push({ pathname: '/learn/[id]', params: { id: String(item.id) } })}
          >
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.title}>{item.title}</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('learn.empty')}</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
