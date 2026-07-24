import { LocateFixed } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text } from 'react-native'
import { colors } from '../constants/colors'
import { spacing } from '../constants/spacing'
import {
  LocationDeniedError,
  LocationServicesOffError,
  resolveCurrentPlace,
  type ResolvedPlace,
} from '../services/location.service'

interface Props {
  onResolved: (place: ResolvedPlace) => void
  label?: string
}

/**
 * Reads the device position and hands the caller back a resolved place. Denial is
 * treated as a normal answer — the member is offered Settings rather than an
 * error, and every form this sits on stays fillable by hand.
 */
export function UseMyLocationButton({ onResolved, label }: Props) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      const place = await resolveCurrentPlace()
      onResolved(place)

      // We have coordinates but no name for them — say so, rather than leaving the
      // member staring at fields that did not change.
      if (!place.geocoded) {
        Alert.alert(t('common.appName'), t('location.noAddressFound'))
      }
    } catch (error) {
      if (error instanceof LocationDeniedError) {
        Alert.alert(t('location.deniedTitle'), t('location.deniedBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('location.openSettings'), onPress: () => Linking.openSettings() },
        ])
      } else if (error instanceof LocationServicesOffError) {
        Alert.alert(t('location.servicesOffTitle'), t('location.servicesOffBody'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('location.openSettings'), onPress: () => Linking.openSettings() },
        ])
      } else {
        console.warn('[location] resolve failed', error)
        Alert.alert(t('common.appName'), t('location.failed'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Pressable
      onPress={run}
      disabled={busy}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.busy]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <LocateFixed size={18} color={colors.primary} strokeWidth={2} />
      )}
      <Text style={styles.label}>{busy ? t('location.finding') : (label ?? t('location.useMine'))}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  busy: {
    opacity: 0.8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
})
