import React, { useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import {
  kolmiColors,
  kolmiFonts,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import { tapMedium, select } from '@/lib/kolmi/haptics'

type Props = {
  onChoice: (choice: 'request' | 'pass') => void
  // Pulse "Demander" si premier profil non décidé du jour.
  pulse?: boolean
  // Désactivé pendant la transition (ex. animation de glide-out).
  disabled?: boolean
}

// Duo Demander / Passer affiché en bas de chaque profil présenté.
// Pas de SwipeToConfirm ici — la friction est gardée pour
// /meeting/request/[id] (l'engagement final). La décision dans la
// conversation est rapide.
function DecisionInline({ onChoice, pulse = false, disabled = false }: Props) {
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    if (!pulse || disabled) {
      pulseScale.value = withTiming(1, { duration: 200 })
      return
    }
    pulseScale.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    )
  }, [pulse, disabled, pulseScale])

  const requestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  const handleRequest = useCallback(() => {
    if (disabled) return
    tapMedium()
    onChoice('request')
  }, [disabled, onChoice])

  const handlePass = useCallback(() => {
    if (disabled) return
    select()
    onChoice('pass')
  }, [disabled, onChoice])

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.requestWrap, requestStyle]}>
        <TouchableOpacity
          onPress={handleRequest}
          activeOpacity={0.85}
          disabled={disabled}
          style={[styles.request, disabled && styles.requestDisabled]}
        >
          <Text style={styles.requestText}>Demander un rendez-vous</Text>
        </TouchableOpacity>
      </Animated.View>
      <TouchableOpacity
        onPress={handlePass}
        activeOpacity={0.7}
        disabled={disabled}
        style={[styles.pass, disabled && styles.passDisabled]}
      >
        <Text style={styles.passText}>Passer</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: kolmiSpace.xs,
    marginVertical: kolmiSpace.md,
  },
  requestWrap: {
    flex: 1,
  },
  request: {
    height: 48,
    borderRadius: kolmiRadius.pill,
    backgroundColor: kolmiColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: kolmiSpace.md,
    shadowColor: '#5A0A0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
  requestDisabled: {
    opacity: 0.4,
    elevation: 0,
    shadowOpacity: 0,
  },
  requestText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 14,
    color: kolmiColors.white,
    letterSpacing: 0.2,
  },
  pass: {
    paddingHorizontal: kolmiSpace.lg,
    height: 48,
    borderRadius: kolmiRadius.pill,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passDisabled: {
    opacity: 0.4,
  },
  passText: {
    fontFamily: kolmiFonts.uiMedium,
    fontSize: 14,
    color: kolmiColors.text,
  },
})

export default React.memo(DecisionInline)
