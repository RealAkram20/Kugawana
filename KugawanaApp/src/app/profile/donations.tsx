import { useQuery } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { foodService } from '../../services/food.service'

export default function MyDonationsScreen() {
  const { t } = useTranslation()
  const { data: donations } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => foodService.myDonations(),
  })

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('profile.myDonations') }} />
      <FlatList
        data={donations ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.left}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.category?.name ?? ''} · {item.quantity}
                </Text>
              </View>
              <Badge
                label={item.status}
                tone={item.status === 'published' ? 'primary' : item.status === 'rejected' ? 'error' : 'muted'}
              />
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('orders.empty')}</Text>}
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
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
