import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useTranslation } from 'react-i18next'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'
import type { PickedImage } from '../../types/food.types'

interface PhotoPickerProps {
  value: PickedImage[]
  onChange: (images: PickedImage[]) => void
  /** Photos already on the listing, shown greyed out as context when editing. */
  existing?: string[]
  max?: number
}

/** Derives a filename the API will accept, since the library may not give one. */
function fileNameFor(uri: string, given?: string | null): string {
  if (given) return given
  const guess = uri.split('/').pop()
  return guess && guess.includes('.') ? guess : `photo-${Date.now()}.jpg`
}

export function PhotoPicker({ value, onChange, existing = [], max = 5 }: PhotoPickerProps) {
  const { t } = useTranslation()
  const remaining = max - value.length

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(t('common.appName'), t('share.photosPermission'))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: max > 1,
      selectionLimit: remaining,
      quality: 0.7,
    })

    if (result.canceled || !result.assets) return

    const picked = result.assets.slice(0, remaining).map((asset) => ({
      uri: asset.uri,
      name: fileNameFor(asset.uri, asset.fileName),
      type: asset.mimeType ?? 'image/jpeg',
    }))

    onChange([...value, ...picked])
  }

  const remove = (uri: string) => onChange(value.filter((image) => image.uri !== uri))

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {existing.map((uri) => (
          <View key={uri} style={[styles.tile, styles.existing]}>
            <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
          </View>
        ))}

        {value.map((image) => (
          <View key={image.uri} style={styles.tile}>
            <Image source={{ uri: image.uri }} style={styles.thumb} contentFit="cover" />
            <Pressable onPress={() => remove(image.uri)} style={styles.remove} hitSlop={8}>
              <Text style={styles.removeLabel}>×</Text>
            </Pressable>
          </View>
        ))}

        {remaining > 0 && (
          <Pressable onPress={pick} style={({ pressed }) => [styles.add, pressed && styles.pressed]}>
            <Text style={styles.addIcon}>+</Text>
            <Text style={styles.addLabel}>{t('share.addPhoto')}</Text>
          </Pressable>
        )}
      </ScrollView>

      <Text style={styles.hint}>{t('share.photosHint', { count: max })}</Text>
    </View>
  )
}

const TILE = 92

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    overflow: 'visible',
  },
  existing: {
    opacity: 0.5,
  },
  thumb: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  remove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  add: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: '#FAFAF7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addIcon: {
    fontSize: 26,
    lineHeight: 30,
    color: colors.primary,
    fontWeight: '600',
  },
  addLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
})
