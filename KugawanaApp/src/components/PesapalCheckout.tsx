import { X } from 'lucide-react-native'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView, type WebViewNavigation } from 'react-native-webview'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'

interface Props {
  /** The Pesapal payment page URL, or null while there is nothing to show. */
  url: string | null
  /** Fired once the payment reaches Pesapal's callback — the flow is finished. */
  onComplete: () => void
  /** Fired when the member dismisses the sheet before finishing. */
  onClose: () => void
}

// Pesapal redirects the browser to the merchant callback once payment finishes.
// The host may differ from what the app knows (LAN IP vs public domain), so match
// on the path rather than the full URL.
const CALLBACK_PATH = '/wallet/pesapal/callback'

/**
 * In-app payment sheet: shows the Pesapal page in a WebView and closes itself the
 * moment payment completes, so the member never leaves the app for a browser.
 */
export function PesapalCheckout({ url, onComplete, onClose }: Props) {
  const { t } = useTranslation()
  // The callback can fire on more than one navigation event; only act once.
  const settled = useRef(false)

  const handleNavigation = (navState: WebViewNavigation) => {
    if (!settled.current && navState.url.includes(CALLBACK_PATH)) {
      settled.current = true
      onComplete()
    }
  }

  const close = () => {
    settled.current = false
    onClose()
  }

  return (
    <Modal
      visible={url !== null}
      animationType="slide"
      onRequestClose={close}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('wallet.payTitle')}</Text>
          <Pressable hitSlop={10} onPress={close} accessibilityRole="button">
            <X size={24} color={colors.textPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        {url ? (
          <WebView
            source={{ uri: url }}
            onNavigationStateChange={handleNavigation}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>{t('wallet.paying')}</Text>
              </View>
            )}
            style={styles.web}
          />
        ) : null}

        <Text style={styles.footer}>{t('wallet.paySecure')}</Text>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  web: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
})
