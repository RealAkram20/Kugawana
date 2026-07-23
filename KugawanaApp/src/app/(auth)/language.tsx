import { router } from 'expo-router'
import { Check, ChevronRight } from 'lucide-react-native'
import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useResponsive } from '../../hooks/useResponsive'
import { Language, useAppStore } from '../../stores/app.store'

const screenColors = {
  background: '#FAFAF8',
  card: '#FDFDFD',
  cardBorder: '#E8E8E8',
  selectedBorder: '#2E7D32',
  title: '#141518',
  subtitle: '#9CA3AF',
  name: '#17181A',
  caption: '#8E9196',
  green: '#2A702E',
  check: '#2F7031',
}

const options: { code: Language; name: string; caption: string; flag: number }[] = [
  { code: 'en', name: 'English', caption: 'Continue in English', flag: require('../../../assets/images/flag-en.png') },
  { code: 'fr', name: 'Français', caption: 'Continuer en Français', flag: require('../../../assets/images/flag-fr.png') },
  { code: 'sw', name: 'Kiswahili', caption: 'Endelea kwa Kiswahili', flag: require('../../../assets/images/flag-sw.png') },
]

export default function LanguageScreen() {
  const storedLanguage = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const [selected, setSelected] = useState<Language>(storedLanguage ?? 'en')
  const { s, vs, ms, compact, tablet, maxContentWidth } = useResponsive()

  const submit = () => {
    setLanguage(selected)
    router.push('/(auth)/register')
  }

  const gutter = s(tablet ? 32 : 24)
  const flagSize = s(compact ? 44 : 50)
  const checkSize = s(27)

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        bounces={false}
      >
        <View style={[styles.content, { maxWidth: maxContentWidth, paddingHorizontal: gutter }]}>
          <View style={[styles.globeWrap, { paddingTop: vs(14) }]}>
            <Image
              source={require('../../../assets/images/globe.png')}
              style={{ width: s(34), height: s(34) }}
              resizeMode="contain"
            />
          </View>

          <Text
            style={[styles.title, { fontSize: ms(34), lineHeight: ms(34) * 1.28, marginTop: vs(28) }]}
            maxFontSizeMultiplier={1.25}
          >
            Choose Your{'\n'}Language
          </Text>
          <Text
            style={[styles.subtitle, { fontSize: ms(16), marginTop: vs(14) }]}
            maxFontSizeMultiplier={1.3}
          >
            Chagua Lugha / Choisissez la langue
          </Text>

          <View style={{ marginTop: vs(32), gap: vs(16) }}>
            {options.map((option) => {
              const active = selected === option.code
              return (
                <Pressable
                  key={option.code}
                  onPress={() => setSelected(option.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.card,
                    { paddingVertical: vs(24), paddingHorizontal: s(14), borderRadius: s(14) },
                    active && styles.cardActive,
                  ]}
                >
                  <Image
                    source={option.flag}
                    style={{ width: flagSize, height: flagSize, borderRadius: flagSize / 2 }}
                  />
                  <View style={[styles.cardText, { marginLeft: s(18) }]}>
                    <Text style={[styles.cardName, { fontSize: ms(20) }]} maxFontSizeMultiplier={1.3}>
                      {option.name}
                    </Text>
                    <Text style={[styles.cardCaption, { fontSize: ms(14) }]} maxFontSizeMultiplier={1.3}>
                      {option.caption}
                    </Text>
                  </View>
                  {active ? (
                    <View
                      style={[
                        styles.check,
                        { width: checkSize, height: checkSize, borderRadius: checkSize / 2 },
                      ]}
                    >
                      <Check color="#FFFFFF" size={s(16)} strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              )
            })}
          </View>

          <View style={[styles.footer, { marginTop: vs(32), paddingBottom: vs(24) }]}>
            <Pressable
              onPress={submit}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                { minHeight: Math.max(48, s(58)), borderRadius: s(13), paddingHorizontal: s(52) },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.buttonLabel, { fontSize: ms(19) }]} maxFontSizeMultiplier={1.3}>
                Continue
              </Text>
              <View style={[styles.buttonArrow, { right: s(22) }]}>
                <ChevronRight color="#FFFFFF" size={s(24)} strokeWidth={2.5} />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: screenColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    width: '100%',
  },
  globeWrap: {
    alignItems: 'flex-end',
  },
  title: {
    fontWeight: '700',
    color: screenColors.title,
    textAlign: 'center',
  },
  subtitle: {
    color: screenColors.subtitle,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: screenColors.card,
    borderWidth: 1.5,
    borderColor: screenColors.cardBorder,
  },
  cardActive: {
    borderColor: screenColors.selectedBorder,
    borderWidth: 2,
  },
  cardText: {
    flex: 1,
  },
  cardName: {
    fontWeight: '700',
    color: screenColors.name,
  },
  cardCaption: {
    color: screenColors.caption,
    marginTop: 3,
  },
  check: {
    backgroundColor: screenColors.check,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: screenColors.green,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonArrow: {
    position: 'absolute',
  },
})
