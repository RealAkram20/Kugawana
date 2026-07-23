import { Redirect, router, Tabs } from 'expo-router'
import { CirclePlus, House, Plus, User, Users } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/auth.store'

const TAB_ICONS = {
  index: House,
  share: CirclePlus,
  community: Users,
  profile: User,
} as const

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] }
  descriptors: Record<string, { options: { title?: string } }>
  navigation: { navigate: (name: string) => void }
}

function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets()

  const renderTab = (routeName: keyof typeof TAB_ICONS) => {
    const index = state.routes.findIndex((route) => route.name === routeName)
    if (index === -1) return null
    const route = state.routes[index]
    const focused = state.index === index
    const label = descriptors[route.key].options.title ?? route.name
    const Icon = TAB_ICONS[routeName]
    const tint = focused ? colors.primary : colors.textMuted

    return (
      <Pressable
        key={route.key}
        style={styles.tabItem}
        onPress={() => {
          if (!focused) navigation.navigate(route.name)
        }}
      >
        <Icon size={24} color={tint} strokeWidth={2} />
        <Text style={[styles.tabLabel, { color: tint }]}>{label}</Text>
      </Pressable>
    )
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {renderTab('index')}
      {renderTab('share')}
      <View style={styles.fabSlot}>
        {/* Straight to the form — the Share tab itself lists what you already shared. */}
        <Pressable style={styles.fab} onPress={() => router.push('/food/create')}>
          <Plus size={30} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      </View>
      {renderTab('community')}
      {renderTab('profile')}
    </View>
  )
}

export default function TabsLayout() {
  const { t } = useTranslation()
  const token = useAuthStore((state) => state.token)
  const hydrated = useAuthStore((state) => state.hydrated)

  if (hydrated && !token) return <Redirect href="/(auth)/register" />

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t('home.homeTab') }} />
      <Tabs.Screen name="share" options={{ title: t('home.myShares') }} />
      <Tabs.Screen name="community" options={{ title: t('community.title') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile.title') }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
})
