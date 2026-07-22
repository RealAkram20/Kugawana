import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useAuthStore } from '../stores/auth.store'

const splashDurationMs = Number(process.env.EXPO_PUBLIC_SPLASH_MS ?? 2500)

const splashColors = {
  background: '#FDFDFB',
  title: '#1A6D17',
  tagline: '#5F6368',
  loading: '#5F6368',
  blob: '#F4F7F0',
}

export default function Splash() {
  const { width } = useWindowDimensions()
  const hydrated = useAuthStore((state) => state.hydrated)
  const token = useAuthStore((state) => state.token)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), splashDurationMs)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!ready || !hydrated) return
    if (token) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(auth)/language')
    }
  }, [ready, hydrated, token])

  return (
    <View style={styles.container}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Kugawana</Text>
        <Text style={styles.tagline}>Connecting Communities{'\n'}Through Food Sharing</Text>
      </View>

      <Image
        source={require('../../assets/images/splash-illustration.png')}
        style={[styles.illustration, { width, height: (width * 1122) / 1051 }]}
        resizeMode="cover"
      />

      <View style={styles.footer}>
        <ActivityIndicator size="large" color={splashColors.title} />
        <Text style={styles.loading}>Loading...</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: splashColors.background,
  },
  blob: {
    position: 'absolute',
    backgroundColor: splashColors.blob,
    borderRadius: 999,
  },
  blobTop: {
    width: 150,
    height: 150,
    top: '10%',
    left: -75,
  },
  blobBottom: {
    width: 110,
    height: 110,
    bottom: '6%',
    left: -55,
  },
  header: {
    alignItems: 'center',
    paddingTop: '22%',
  },
  logo: {
    width: 148,
    height: 148,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: splashColors.title,
    marginTop: 10,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 23,
    color: splashColors.tagline,
    textAlign: 'center',
    marginTop: 12,
  },
  illustration: {
    position: 'absolute',
    bottom: 60,
    left: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
  },
  loading: {
    fontSize: 16,
    color: splashColors.loading,
  },
})
