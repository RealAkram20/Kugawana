import { useQuery } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
import {
  ChevronRight,
  Clock,
  FileText,
  Flag,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { CartButton } from '../../components/CartButton'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { supportService } from '../../services/support.service'

type Row = {
  key: string
  label: string
  sub?: string | null
  Icon: typeof Mail
  color: string
  onPress: () => void
}

export default function HelpScreen() {
  const { t } = useTranslation()

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['support'],
    queryFn: () => supportService.overview(),
  })

  const openUrl = (url: string) =>
    Linking.openURL(url).catch(() =>
      Alert.alert(t('common.appName'), t('help.cannotOpen')),
    )

  const contact = data?.contact
  const reachRows: Row[] = []

  if (contact?.email) {
    reachRows.push({
      key: 'email',
      label: t('profile.contactUs'),
      sub: contact.email,
      Icon: Mail,
      color: colors.primary,
      onPress: () => openUrl(`mailto:${contact.email}`),
    })
  }
  if (contact?.phone) {
    reachRows.push({
      key: 'phone',
      label: t('help.callUs'),
      sub: contact.phone,
      Icon: Phone,
      color: '#0F8A6B',
      onPress: () => openUrl(`tel:${contact.phone!.replace(/\s+/g, '')}`),
    })
  }
  if (contact?.whatsapp) {
    reachRows.push({
      key: 'whatsapp',
      label: t('help.whatsapp'),
      sub: contact.whatsapp,
      Icon: MessageCircle,
      color: '#25D366',
      onPress: () => openUrl(`whatsapp://send?phone=${contact.whatsapp}`),
    })
  }

  const helpRows: Row[] = []

  if ((data?.faqs.length ?? 0) > 0) {
    helpRows.push({
      key: 'faq',
      label: t('profile.faq'),
      sub: t('help.faqCount', { count: data!.faqs.length }),
      Icon: HelpCircle,
      color: '#7C3AED',
      onPress: () => router.push('/profile/faq'),
    })
  }

  helpRows.push({
    key: 'report',
    label: t('profile.reportProblem'),
    Icon: Flag,
    color: colors.error,
    onPress: () => router.push('/profile/report'),
  })

  const policyRows: Row[] = (data?.pages ?? []).map((page) => ({
    key: page.slug,
    label: page.title,
    Icon: FileText,
    color: '#2F6FED',
    onPress: () =>
      router.push({ pathname: '/profile/page/[slug]', params: { slug: page.slug } }),
  }))

  const renderCard = (rows: Row[], title?: string) =>
    rows.length > 0 ? (
      <>
        {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
        <View style={styles.card}>
          {rows.map((row, index) => (
            <Pressable
              key={row.key}
              onPress={row.onPress}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <row.Icon size={22} color={row.color} strokeWidth={2} />
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                {row.sub ? <Text style={styles.rowSub}>{row.sub}</Text> : null}
              </View>
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
              {index < rows.length - 1 && <View style={styles.divider} />}
            </Pressable>
          ))}
        </View>
      </>
    ) : null

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('profile.helpTitle'),
          headerRight: () => <CartButton />,
        }}
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
          <Text style={styles.intro}>{data?.intro || t('profile.helpIntro')}</Text>

          {renderCard(reachRows, t('help.getInTouch'))}

          {contact?.hours ? (
            <View style={styles.hoursRow}>
              <Clock size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.hours}>{contact.hours}</Text>
            </View>
          ) : null}

          {renderCard(helpRows, t('help.needHelp'))}
          {renderCard(policyRows, t('help.policies'))}
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
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  rowSub: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    position: 'absolute',
    left: 22 + spacing.md,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  hours: {
    fontSize: 14,
    color: colors.textSecondary,
  },
})
