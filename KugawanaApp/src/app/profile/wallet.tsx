import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Card } from '../../components/ui/Card'
import { CartButton } from '../../components/CartButton'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { walletService } from '../../services/orders.service'

const CALLBACK_URL = `${process.env.EXPO_PUBLIC_API_URL}/wallet/pesapal/callback`

export default function WalletScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [processingId, setProcessingId] = useState<number | null>(null)

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletService.wallet(),
  })

  const { data: packages } = useQuery({
    queryKey: ['packages'],
    queryFn: () => walletService.packages(),
  })

  const refreshWallet = () => queryClient.invalidateQueries({ queryKey: ['wallet'] })

  // Pesapal confirms out of band, so after the browser closes we poll the
  // backend, which checks the transaction and credits points idempotently.
  const confirmTopup = async (topupId: number) => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const status = await walletService.topupStatus(topupId)

      if (status.status === 'approved') {
        refreshWallet()
        Alert.alert(t('common.appName'), t('wallet.topupComplete'))
        return
      }

      if (status.status === 'rejected') {
        Alert.alert(t('common.appName'), t('wallet.payFailed'))
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))
    }

    refreshWallet()
    Alert.alert(t('common.appName'), t('wallet.topupPending'))
  }

  const buyPackage = async (packageId: number) => {
    setProcessingId(packageId)

    try {
      const order = await walletService.topup(packageId, 'pesapal')

      if (!order.redirect_url) {
        refreshWallet()
        Alert.alert(t('common.appName'), t('wallet.requested'))
        return
      }

      await WebBrowser.openAuthSessionAsync(order.redirect_url, CALLBACK_URL)
      await confirmTopup(order.id)
    } catch (error: any) {
      const message = error.response?.data?.message ?? t('wallet.payFailed')
      Alert.alert(t('common.appName'), message)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('wallet.title'), headerRight: () => <CartButton /> }} />
      <FlatList
        data={wallet?.transactions ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Card style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>{t('wallet.balance')}</Text>
              <Text style={styles.balance}>{wallet?.balance ?? 0}</Text>
            </Card>

            <Text style={styles.sectionTitle}>{t('wallet.packages')}</Text>
            <View style={styles.packages}>
              {(packages ?? []).map((pkg) => (
                <Pressable
                  key={pkg.id}
                  style={styles.package}
                  onPress={() => buyPackage(pkg.id)}
                  disabled={processingId !== null}
                >
                  {processingId === pkg.id ? (
                    <ActivityIndicator color={colors.primary} style={styles.packageSpinner} />
                  ) : (
                    <>
                      <Text style={styles.packagePoints}>{pkg.points}</Text>
                      <Text style={styles.packageUnit}>{t('common.points')}</Text>
                      <Text style={styles.packagePrice}>
                        {pkg.currency} {Number(pkg.price).toLocaleString()}
                      </Text>
                    </>
                  )}
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>{t('wallet.history')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.txn}>
            <View style={styles.txnLeft}>
              <Text style={styles.txnReason}>{item.reason}</Text>
              <Text style={styles.txnDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.txnPoints, item.type === 'debit' && styles.txnDebit]}>
              {item.type === 'credit' ? '+' : '-'}{item.points}
            </Text>
          </View>
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
    paddingBottom: spacing.xl,
  },
  balanceCard: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#D7E8D7',
  },
  balance: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.surface,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  packages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  package: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
  },
  packageSpinner: {
    height: 62,
  },
  packagePoints: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  packageUnit: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  packagePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  txn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  txnLeft: {
    flex: 1,
  },
  txnReason: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  txnDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  txnPoints: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
  },
  txnDebit: {
    color: colors.error,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
})
