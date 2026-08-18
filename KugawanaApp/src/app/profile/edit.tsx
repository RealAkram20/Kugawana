import { useMutation, useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router, Stack } from 'expo-router'
import { Camera } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CartButton } from '../../components/CartButton'
import { UseMyLocationButton } from '../../components/UseMyLocationButton'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { authService } from '../../services/auth.service'
import { countryService, matchCountry } from '../../services/country.service'
import type { ResolvedPlace } from '../../services/location.service'
import { useAuthStore } from '../../stores/auth.store'
import type { PickedImage } from '../../types/food.types'

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const clear = useAuthStore((state) => state.clear)
  const insets = useSafeAreaInsets()
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = () => {
    Alert.alert(t('editProfile.deleteTitle'), t('editProfile.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('editProfile.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            await authService.deleteAccount()
            clear()
            router.replace('/(auth)/register')
          } catch {
            Alert.alert(t('common.appName'), t('editProfile.deleteFailed'))
          } finally {
            setDeleting(false)
          }
        },
      },
    ])
  }

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [district, setDistrict] = useState(user?.district ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [countryId, setCountryId] = useState<number | null>(user?.country_id ?? null)
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    user?.latitude != null && user?.longitude != null
      ? { latitude: user.latitude, longitude: user.longitude }
      : null,
  )
  const [outsideNotice, setOutsideNotice] = useState<string | null>(null)
  const [photo, setPhoto] = useState<PickedImage | null>(null)

  /** Filename the API will accept, since the picker may not supply one. */
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(t('common.appName'), t('share.photosPermission'))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (result.canceled || !result.assets?.length) return

    const asset = result.assets[0]
    const guess = asset.uri.split('/').pop()

    setPhoto({
      uri: asset.uri,
      name: asset.fileName || (guess?.includes('.') ? guess : `avatar-${Date.now()}.jpg`),
      type: asset.mimeType ?? 'image/jpeg',
    })
  }

  const { data: countries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => countryService.list(),
  })

  /**
   * Fill what the geocoder found. The country only moves if Kugawana operates
   * there — otherwise the member keeps whatever they had and gets told why.
   */
  const applyPlace = (place: ResolvedPlace) => {
    if (place.district) setDistrict(place.district)
    if (place.address) setAddress(place.address)
    setCoords({ latitude: place.latitude, longitude: place.longitude })

    const match = matchCountry(countries, place.isoCountryCode)

    if (match) {
      setCountryId(match.id)
      setOutsideNotice(null)
    } else if (place.countryName) {
      setOutsideNotice(t('location.countryUnsupported', { country: place.countryName }))
    }
  }

  const save = useMutation({
    mutationFn: () =>
      authService.updateProfile(
        {
          name: name.trim(),
          phone: phone.trim() || null,
          country_id: countryId,
          district: district.trim() || null,
          address: address.trim() || null,
          bio: bio.trim() || null,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        },
        photo,
      ),
    onSuccess: (updated) => {
      setUser(updated)
      Alert.alert(t('common.appName'), t('editProfile.saved'))
      if (router.canGoBack()) router.back()
    },
    onError: (error: any) =>
      Alert.alert(t('common.appName'), error.response?.data?.message ?? t('editProfile.saveFailed')),
  })

  const submit = () => {
    if (!name.trim()) {
      Alert.alert(t('common.appName'), t('editProfile.nameRequired'))
      return
    }
    save.mutate()
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: t('profile.editProfile'), headerRight: () => <CartButton /> }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarBlock}>
            <Pressable onPress={pickPhoto} style={styles.avatarWrap} accessibilityRole="button">
              {photo?.uri || user?.profile_photo ? (
                <Image
                  source={{ uri: photo?.uri ?? user!.profile_photo! }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{name.slice(0, 1) || '?'}</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={18} color={colors.surface} strokeWidth={2} />
              </View>
            </Pressable>
            <Pressable onPress={pickPhoto}>
              <Text style={styles.changePhoto}>{t('editProfile.changePhoto')}</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>{t('editProfile.name')}</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>{t('editProfile.phone')}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder={t('editProfile.phonePlaceholder')}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>{t('location.whereYouAre')}</Text>
          <UseMyLocationButton onResolved={applyPlace} />
          <Text style={styles.hint}>{t('location.profileHint')}</Text>
          {outsideNotice ? <Text style={styles.notice}>{outsideNotice}</Text> : null}

          <Text style={styles.label}>{t('editProfile.country')}</Text>
          <View style={styles.chipRow}>
            {(countries ?? []).map((country) => {
              const selected = countryId === country.id
              return (
                <Pressable
                  key={country.id}
                  onPress={() => setCountryId(selected ? null : country.id)}
                  style={[styles.chip, selected && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipLabelActive]}>
                    {country.name}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={styles.label}>{t('editProfile.district')}</Text>
          <TextInput style={styles.input} value={district} onChangeText={setDistrict} />

          <Text style={styles.label}>{t('editProfile.address')}</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} />

          <Text style={styles.label}>{t('editProfile.bio')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={bio}
            onChangeText={setBio}
            placeholder={t('editProfile.bioPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.counter}>{bio.length}/500</Text>

          <Pressable style={styles.deleteRow} onPress={confirmDelete} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.deleteLabel}>{t('editProfile.deleteAccount')}</Text>
            )}
          </Pressable>
          <Text style={styles.deleteHint}>{t('editProfile.deleteHint')}</Text>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <Pressable
            disabled={save.isPending}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed, save.isPending && styles.disabled]}
            onPress={submit}
          >
            {save.isPending ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.saveLabel}>{t('sharedFood.save')}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textarea: {
    minHeight: 110,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  avatarWrap: {
    width: 112,
    height: 112,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#ECEDE7',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.primary,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  changePhoto: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  hint: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  notice: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.error,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: '#EDF5ED',
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipLabelActive: {
    color: colors.primary,
  },
  counter: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
  },
  deleteRow: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  deleteLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  deleteHint: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.6,
  },
})
