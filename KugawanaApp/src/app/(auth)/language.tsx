import { router } from 'expo-router'
import { Check, ChevronRight } from 'lucide-react-native'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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

  const submit = () => {
    setLanguage(selected)
    router.push('/(auth)/register')
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.globeWrap}>
        <Image source={require('../../../assets/images/globe.png')} style={styles.globe} resizeMode="contain" />
      </View>

      <Text style={styles.title}>Choose Your{'\n'}Language</Text>
      <Text style={styles.subtitle}>Chagua Lugha / Choisissez la langue</Text>

      <View style={styles.list}>
        {options.map((option) => {
          const active = selected === option.code
          return (
            <Pressable
              key={option.code}
              onPress={() => setSelected(option.code)}
              style={[styles.card, active && styles.cardActive]}
            >
              <Image source={option.flag} style={styles.flag} />
              <View style={styles.cardText}>
                <Text style={styles.cardName}>{option.name}</Text>
                <Text style={styles.cardCaption}>{option.caption}</Text>
              </View>
              {active ? (
                <View style={styles.check}>
                  <Check color="#FFFFFF" size={16} strokeWidth={3} />
                </View>
              ) : null}
            </Pressable>
          )
        })}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={submit} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonLabel}>Continue</Text>
          <View style={styles.buttonArrow}>
            <ChevronRight color="#FFFFFF" size={24} strokeWidth={2.5} />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: screenColors.background,
    paddingHorizontal: 28,
  },
  globeWrap: {
    alignItems: 'flex-end',
    paddingTop: 14,
    marginRight: -12,
  },
  globe: {
    width: 34,
    height: 34,
  },
  title: {
    fontSize: 34,
    lineHeight: 44,
    fontWeight: '700',
    color: screenColors.title,
    textAlign: 'center',
    marginTop: 64,
  },
  subtitle: {
    fontSize: 16,
    color: screenColors.subtitle,
    textAlign: 'center',
    marginTop: 18,
  },
  list: {
    marginTop: 44,
    gap: 18,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: screenColors.card,
    borderWidth: 1.5,
    borderColor: screenColors.cardBorder,
    borderRadius: 14,
    paddingVertical: 25,
    paddingHorizontal: 14,
  },
  cardActive: {
    borderColor: screenColors.selectedBorder,
    borderWidth: 2,
  },
  flag: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  cardText: {
    flex: 1,
    marginLeft: 18,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '700',
    color: screenColors.name,
  },
  cardCaption: {
    fontSize: 14,
    color: screenColors.caption,
    marginTop: 3,
  },
  check: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: screenColors.check,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 72,
  },
  button: {
    backgroundColor: screenColors.green,
    borderRadius: 13,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '600',
  },
  buttonArrow: {
    position: 'absolute',
    right: 22,
  },
})
