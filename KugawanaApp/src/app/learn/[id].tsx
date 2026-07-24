import { useQuery } from '@tanstack/react-query'
import { Stack, useLocalSearchParams } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { CartButton } from '../../components/CartButton'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { learnService } from '../../services/learn.service'

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: article } = useQuery({
    queryKey: ['learn', Number(id)],
    queryFn: () => learnService.article(Number(id)),
  })

  if (!article) return <View style={styles.container} />

  const plain = article.content.replace(/<[^>]+>/g, '')

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: article.category, headerRight: () => <CartButton /> }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.body}>{plain}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
  },
})
