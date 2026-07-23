import { useMutation } from '@tanstack/react-query'
import { router, Stack } from 'expo-router'
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
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'

export default function EditProfileScreen() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [district, setDistrict] = useState(user?.district ?? '')
  const [address, setAddress] = useState(user?.address ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')

  const save = useMutation({
    mutationFn: () =>
      authService.updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        district: district.trim() || null,
        address: address.trim() || null,
        bio: bio.trim() || null,
      }),
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
      <Stack.Screen options={{ headerShown: true, title: t('profile.editProfile') }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
        </ScrollView>

        <View style={styles.footer}>
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
  counter: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
    fontSize: 13,
    color: colors.textMuted,
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
