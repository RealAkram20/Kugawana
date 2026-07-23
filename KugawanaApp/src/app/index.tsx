import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { communityService } from '../services/community.service'
import { foodService } from '../services/food.service'
import { learnService } from '../services/learn.service'
import { useAuthStore } from '../stores/auth.store'

/** How long the branded screen shows at minimum, even if everything is ready. */
const splashDurationMs = Number(process.env.EXPO_PUBLIC_SPLASH_MS ?? 2500)

/** A slow or dead network must never strand people on the splash. */
const maxDataWaitMs = 6000

const splashColors = {
  background: '#FDFDFB',
  title: '#1A6D17',
  tagline: '#5F6368',
  loading: '#5F6368',
  blob: '#F4F7F0',
}

export default function Splash() {
  const { width } = useWindowDimensions()
  const queryClient = useQueryClient()
  const hydrated = useAuthStore((state) => state.hydrated)
  const token = useAuthStore((state) => state.token)
  const [ready, setReady] = useState(false)
  const [dataWarm, setDataWarm] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), splashDurationMs)
    return () => clearTimeout(timer)
  }, [])

  // Fill the cache with what the home screen needs while the splash is still
  // showing, so the tabs open populated instead of empty-then-popping-in.
  useEffect(() => {
    if (!hydrated) return

    if (!token) {
      setDataWarm(true)
      return
    }

    let cancelled = false

    const warm = Promise.all([
      queryClient.prefetchQuery({ queryKey: ['food'], queryFn: () => foodService.getListings() }),
      queryClient.prefetchQuery({ queryKey: ['community'], queryFn: () => communityService.feed() }),
      queryClient.prefetchQuery({ queryKey: ['learn'], queryFn: () => learnService.articles() }),
    ])

    const capped = new Promise<void>((resolve) => setTimeout(resolve, maxDataWaitMs))

    // prefetchQuery swallows its own errors, so a failed request just means the
    // home screen falls back to fetching normally rather than hanging here.
    Promise.race([warm, capped]).then(() => {
      if (!cancelled) setDataWarm(true)
    })

    return () => {
      cancelled = true
    }
  }, [hydrated, token, queryClient])

  useEffect(() => {
    if (!ready || !hydrated || !dataWarm) return
    if (token) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(auth)/language')
    }
  }, [ready, hydrated, dataWarm, token])

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
