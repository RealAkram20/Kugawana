import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ArrowLeft, ChevronDown, MapPin, MessageCircle, Package, ShoppingBag, X } from 'lucide-react-native'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PhotoPicker } from '../../components/food/PhotoPicker'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import { communityService } from '../../services/community.service'
import type { PostType } from '../../types/community.types'
import type { PickedImage } from '../../types/food.types'

const LOCATIONS = ['Kampala, Uganda', 'Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya', 'Nakuru, Kenya']

const TYPES: { key: PostType; Icon: typeof ShoppingBag }[] = [
  { key: 'request', Icon: ShoppingBag },
  { key: 'offer', Icon: Package },
  { key: 'discussion', Icon: MessageCircle },
]

export default function CreatePostScreen() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [type, setType] = useState<PostType>('request')
  const [title, setTitle] = useState('')
  const [quantity, setQuantity] = useState('')
  const [location, setLocation] = useState(LOCATIONS[0])
  const [details, setDetails] = useState('')
  const [images, setImages] = useState<PickedImage[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)

  const labelKey = { request: 'needLabel', offer: 'offerLabel', discussion: 'topicLabel' }[type]
  const placeholderKey = {
    request: 'needPlaceholder',
    offer: 'offerPlaceholder',
    discussion: 'topicPlaceholder',
  }[type]

  const buildContent = () => {
    const headline =
      type !== 'discussion' && quantity.trim()
        ? `${title.trim()} — ${quantity.trim()}`
        : title.trim()
    return [headline, details.trim()].filter(Boolean).join('\n\n')
  }

  const post = useMutation({
    mutationFn: () =>
      communityService.post({ content: buildContent(), post_type: type, location, images }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community'] })
      Alert.alert(t('common.appName'), t('createPost.posted'))
      close()
    },
    onError: () => Alert.alert(t('common.appName'), t('createPost.postFailed')),
  })

  const submit = () => {
    if (!title.trim()) {
      Alert.alert(t('common.appName'), t('createPost.titleRequired'))
      return
    }
    post.mutate()
  }

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/community'))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={close}>
          <ArrowLeft size={26} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('createPost.title')}</Text>
        <Pressable hitSlop={12} onPress={close}>
          <X size={26} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('createPost.postType')}</Text>
          <View style={styles.typeRow}>
            {TYPES.map(({ key, Icon }) => {
              const active = type === key
              return (
                <Pressable
                  key={key}
                  onPress={() => setType(key)}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                >
                  <Icon size={20} color={active ? colors.primary : colors.textPrimary} strokeWidth={2} />
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                    {t(`createPost.${key}`)}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={styles.label}>{t(`createPost.${labelKey}`)}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t(`createPost.${placeholderKey}`)}
            placeholderTextColor={colors.textMuted}
          />

          {type !== 'discussion' && (
            <>
              <Text style={styles.label}>{t('createPost.quantity')}</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder={t('createPost.quantityPlaceholder')}
                placeholderTextColor={colors.textMuted}
              />
            </>
          )}

          <Text style={styles.label}>{t('createPost.photos')}</Text>
          <PhotoPicker value={images} onChange={setImages} max={4} />

          <Text style={styles.label}>{t('createPost.location')}</Text>
          <Pressable style={styles.locationField} onPress={() => setPickerOpen((open) => !open)}>
            <MapPin size={20} color={colors.textPrimary} strokeWidth={2} />
            <Text style={styles.locationValue}>{location}</Text>
            <ChevronDown size={20} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          {pickerOpen && (
            <View style={styles.pickerList}>
              {LOCATIONS.map((item) => (
                <Pressable
                  key={item}
                  style={styles.pickerItem}
                  onPress={() => {
                    setLocation(item)
                    setPickerOpen(false)
                  }}
                >
                  <Text style={[styles.pickerItemText, item === location && styles.pickerItemActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.label}>{t('createPost.details')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={details}
            onChangeText={setDetails}
            placeholder={t('createPost.detailsPlaceholder')}
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={submit}
            disabled={post.isPending}
            style={({ pressed }) => [styles.postBtn, pressed && styles.postPressed]}
          >
            <Text style={styles.postLabel}>{t('createPost.post')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#EDF5ED',
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  typeLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  textarea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  locationValue: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  pickerItemActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  postBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  postPressed: {
    opacity: 0.9,
  },
  postLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.surface,
  },
})
