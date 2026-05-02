import React, { useCallback } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import {
  kolmiColors,
  kolmiFonts,
  kolmiRadius,
  kolmiSpace,
} from '@/constants/kolmiTheme'
import type { SelectedProfile } from '@/data/mockSelectedProfiles'
import type { Choice } from '@/lib/kolmi/conversationEngine'

type Props = {
  profile: SelectedProfile
  decision: Choice
  onPress?: (id: string) => void
}

// Mini-recap d'un profil après décision. Avatar 32 + prénom + Maison
// + chip de status. Hauteur compacte (~52 px). C'est ce qui remplace
// la grosse carte une fois que l'utilisateur a tapé Demander/Passer.
function ProfileMiniRecap({ profile, decision, onPress }: Props) {
  const handlePress = useCallback(() => onPress?.(profile.id), [onPress, profile.id])

  const isRequested = decision === 'request'

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && styles.rowPressed,
      ]}
    >
      <View style={styles.avatarWrap}>
        {profile.photoUrl ? (
          <Image
            source={{ uri: profile.photoUrl }}
            style={styles.avatar}
            contentFit="cover"
            transition={120}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>
              {profile.firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>
          {profile.firstName}, {profile.age}
        </Text>
        <Text style={styles.maison} numberOfLines={1}>
          {profile.dnaLabel}
        </Text>
      </View>
      <View style={[styles.chip, isRequested ? styles.chipRequested : styles.chipPassed]}>
        <Text style={[styles.chipText, isRequested ? styles.chipTextRequested : styles.chipTextPassed]}>
          {isRequested ? 'Demandé' : 'Passé'}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: kolmiSpace.sm,
    paddingVertical: kolmiSpace.xs,
    paddingHorizontal: kolmiSpace.sm,
    marginVertical: 6,
    borderRadius: kolmiRadius.md,
  },
  rowPressed: {
    opacity: 0.85,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: kolmiColors.surfaceSoft,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#EFE7DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: kolmiFonts.serif,
    fontSize: 16,
    color: kolmiColors.accent,
  },
  name: {
    fontFamily: kolmiFonts.serif,
    fontSize: 15,
    color: kolmiColors.text,
    letterSpacing: -0.2,
  },
  maison: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 12,
    color: kolmiColors.textMuted,
    marginTop: 1,
  },
  chip: {
    paddingHorizontal: kolmiSpace.sm,
    paddingVertical: 4,
    borderRadius: kolmiRadius.pill,
  },
  chipRequested: {
    backgroundColor: kolmiColors.accent,
  },
  chipPassed: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: kolmiColors.outline,
  },
  chipText: {
    fontFamily: kolmiFonts.uiSemiBold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  chipTextRequested: {
    color: kolmiColors.white,
  },
  chipTextPassed: {
    color: kolmiColors.textMuted,
  },
})

export default React.memo(ProfileMiniRecap)
