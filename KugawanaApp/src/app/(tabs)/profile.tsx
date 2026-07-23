import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import {
  Camera,
  ChevronRight,
  ClipboardList,
  Globe,
  HelpCircle,
  LogOut,
  MapPin,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
} from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import i18n from '../../locales/i18n'
import { authService } from '../../services/auth.service'
import { foodService } from '../../services/food.service'
import { ordersService } from '../../services/orders.service'
import { Language, useAppStore } from '../../stores/app.store'
import { useAuthStore } from '../../stores/auth.store'

const iconColors = {
  language: colors.textPrimary,
  shared: colors.primary,
  requests: colors.accent,
  wallet: '#0F8A6B',
  members: '#2F6FED',
  settings: '#2F6FED',
  help: '#7C3AED',
  logout: colors.error,
}

const languages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'fr', label: 'Français' },
]

export default function ProfileScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const [langOpen, setLangOpen] = useState(false)

  const { data: donations } = useQuery({
    queryKey: ['my-donations'],
    queryFn: () => foodService.myDonations(),
  })
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersService.myOrders(),
  })

  const currentLang = languages.find((l) => l.code === (language ?? 'en'))?.label ?? 'English'
  const location = [user?.district, user?.address].filter(Boolean).join(', ')

  const chooseLanguage = (code: Language) => {
    setLanguage(code)
    i18n.changeLanguage(code)
    setLangOpen(false)
  }

  const signOut = () => {
    Alert.alert(t('profile.logout'), t('profile.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.logout'),
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout()
          } catch {
          } finally {
            clear()
            router.replace('/(auth)/register')
          }
        },
      },
    ])
  }

  const comingSoon = () => Alert.alert(t('common.appName'), t('common.comingSoon'))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.topBarSide} />
          <Text style={styles.topBarTitle}>{t('profile.title')}</Text>
          <Pressable
            style={styles.topBarSide}
            hitSlop={8}
            onPress={() => router.push('/profile/settings')}
          >
            <Settings size={24} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            {user?.profile_photo ? (
              <Image source={{ uri: user.profile_photo }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{user?.name?.slice(0, 1) ?? '?'}</Text>
              </View>
            )}
            <Pressable style={styles.cameraBadge} hitSlop={8} onPress={comingSoon}>
              <Camera size={18} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>

          <Text style={styles.name}>{user?.name ?? 'Kugawana User'}</Text>
          {!!user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
          {!!location && (
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.location}>{location}</Text>
            </View>
          )}
        </View>

        <View style={styles.menu}>
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => setLangOpen((open) => !open)}
          >
            <Globe size={24} color={iconColors.language} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('profile.language')}</Text>
              <Text style={[styles.rowSub, styles.rowSubAccent]}>{currentLang}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>

          {langOpen && (
            <View style={styles.langPills}>
              {languages.map((lang) => {
                const active = (language ?? 'en') === lang.code
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => chooseLanguage(lang.code)}
                    style={[styles.langPill, active && styles.langPillActive]}
                  >
                    <Text style={[styles.langPillLabel, active && styles.langPillLabelActive]}>
                      {lang.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push('/profile/donations')}
          >
            <ShoppingBag size={24} color={iconColors.shared} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('profile.sharedFood')}</Text>
              <Text style={styles.rowSub}>{t('profile.itemsCount', { count: donations?.length ?? 0 })}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push('/profile/requests')}
          >
            <ClipboardList size={24} color={iconColors.requests} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('profile.myRequests')}</Text>
              <Text style={styles.rowSub}>{t('profile.requestsCount', { count: orders?.length ?? 0 })}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push('/profile/wallet')}
          >
            <Wallet size={24} color={iconColors.wallet} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('profile.wallet')}</Text>
              <Text style={[styles.rowSub, styles.rowSubAccent]}>
                {t('wallet.pointsBalance', { count: user?.wallet_balance ?? 0 })}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push('/community/members')}
          >
            <Users size={24} color={iconColors.members} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('members.title')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push('/profile/settings')}
          >
            <Settings size={24} color={iconColors.settings} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('profile.settings')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => router.push('/profile/help')}
          >
            <HelpCircle size={24} color={iconColors.help} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('profile.help')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={signOut}
          >
            <LogOut size={24} color={iconColors.logout} strokeWidth={2} />
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{t('profile.logout')}</Text>
            </View>
            <ChevronRight size={20} color={colors.textMuted} strokeWidth={2} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const avatarSize = 120

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  topBarSide: {
    width: 32,
    alignItems: 'flex-end',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  identity: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  avatarWrap: {
    width: avatarSize,
    height: avatarSize,
    marginBottom: spacing.md,
  },
  avatar: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: '#ECEDE7',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 44,
    fontWeight: '700',
    color: colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  phone: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  location: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
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
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowSub: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  rowSubAccent: {
    color: colors.primary,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 24 + spacing.md,
  },
  langPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    paddingLeft: 24 + spacing.md,
  },
  langPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
  },
  langPillActive: {
    borderColor: colors.primary,
    backgroundColor: '#EDF5ED',
  },
  langPillLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langPillLabelActive: {
    color: colors.primary,
  },
})
