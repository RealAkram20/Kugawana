import { Image } from 'expo-image'
import { MapPin } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../constants/colors'
import { spacing } from '../../constants/spacing'

export type StatusTone = 'positive' | 'warning' | 'negative' | 'neutral'

interface ListingCardProps {
  image: string | null
  title: string
  subtitle: string
  location: string | null
  time: string
  statusLabel: string
  tone?: StatusTone
  onPress?: () => void
  /** Drops the border and radius so the row can sit inside a larger container. */
  flat?: boolean
}

/**
 * The food row shared by "My Shared Food" and "My Requests": thumbnail on the
 * left, title and status on the first line, quantity beneath, then pickup
 * location and elapsed time on the last line.
 */
export function ListingCard({
  image,
  title,
  subtitle,
  location,
  time,
  statusLabel,
  tone = 'neutral',
  onPress,
  flat = false,
}: ListingCardProps) {
  const body = (
    <>
      {image ? (
        <Image source={image} style={styles.thumb} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Text style={styles.thumbInitial}>{title.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[
              styles.status,
              tone === 'positive' && styles.statusPositive,
              tone === 'warning' && styles.statusWarning,
              tone === 'negative' && styles.statusNegative,
            ]}
          >
            {statusLabel}
          </Text>
        </View>

        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        <View style={styles.bottomRow}>
          {location ? (
            <>
              <MapPin size={16} color={colors.textSecondary} strokeWidth={2} />
              <Text style={styles.location} numberOfLines={1}>
                {location}
              </Text>
            </>
          ) : (
            <View style={styles.spacer} />
          )}
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
    </>
  )

  if (!onPress) return <View style={[styles.card, flat && styles.flat]}>{body}</View>

  return (
    <Pressable
      style={({ pressed }) => [styles.card, flat && styles.flat, pressed && styles.pressed]}
      onPress={onPress}
    >
      {body}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  flat: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.9,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  thumbInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.surface,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  status: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusPositive: {
    color: colors.primary,
  },
  statusWarning: {
    color: colors.warning,
  },
  statusNegative: {
    color: colors.textMuted,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  spacer: {
    flex: 1,
  },
  location: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
  },
  time: {
    fontSize: 15,
    color: colors.textSecondary,
  },
})
