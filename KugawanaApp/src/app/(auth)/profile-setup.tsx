import { router } from 'expo-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../stores/auth.store'

interface ProfileForm {
  district: string
  address: string
}

export default function ProfileSetupScreen() {
  const { t } = useTranslation()
  const { control, handleSubmit } = useForm<ProfileForm>({
    defaultValues: { district: '', address: '' },
  })
  const [loading, setLoading] = useState(false)
  const setUser = useAuthStore((state) => state.setUser)

  const submit = handleSubmit(async (values) => {
    setLoading(true)
    try {
      const user = await authService.updateProfile(values)
      setUser(user)
    } catch {
    } finally {
      setLoading(false)
      router.replace('/(tabs)')
    }
  })

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.profileSetup')}</Text>
      <Input control={control} name="district" label={t('auth.district')} />
      <Input control={control} name="address" label={t('auth.address')} />
      <Button label={t('common.continue')} onPress={submit} loading={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
})
