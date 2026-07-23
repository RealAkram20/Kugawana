import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../../constants/colors'
import { spacing } from '../../../constants/spacing'
import { foodService } from '../../../services/food.service'

export default function InterestedPeopleScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const foodId = Number(id)

  const { data: people } = useQuery({
    queryKey: ['food-interested', foodId],
    queryFn: () => foodService.interestedPeople(foodId),
  })

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('sharedFood.peopleInterested') }} />
      <FlatList
        data={people ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.profile_photo ? (
              <Image source={item.profile_photo} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{item.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {[item.district, item.requested_ago].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>{t('sharedFood.noInterest')}</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  list: {
    padding: spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
})
