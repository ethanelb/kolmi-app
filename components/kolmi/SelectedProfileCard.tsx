import React, { useCallback } from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { kolmiColors, kolmiFonts, kolmiRadius, kolmiSpace, fontScale } from '@/constants/kolmiTheme'
import ProfilePhotoPlaceholder from '@/components/kolmi/ProfilePhotoPlaceholder'
import type { SelectedProfile } from '@/data/mockSelectedProfiles'

type Props = {
  profile: SelectedProfile
  // Reçoit l'id pour que le parent puisse stabiliser le handler avec
  // `useCallback` — sinon `React.memo` est défait par une arrow inline.
  onPress: (id: string) => void
}

// Format "page de lettre" : photo poster en haut (ratio 4:5), corps
// éditorial dessous avec prénom serif, Maison italique bordeaux, ligne
// profession+ville, hairline 32px, et une petite phrase italique signée
// du matchmaker. Aucun match score numérique — banni par le brief.
function SelectedProfileCard({ profile, onPress }: Props) {
  const handlePress = useCallback(() => onPress(profile.id), [onPress, profile.id])
  const subtitleText =
    profile.occupation && profile.city
      ? `${profile.occupation} · ${profile.city}`
      : profile.occupation ?? profile.city
  const teaser = profile.teaser ?? profile.reason

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.photoWrap}>
        {profile.photoUrl ? (
          <Image
            source={{ uri: profile.photoUrl }}
            style={styles.photo}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <ProfilePhotoPlaceholder height={undefined} initial={profile.firstName} />
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name}>
          {profile.firstName}, {profile.age}
        </Text>
        <Text style={styles.maison}>{profile.dnaLabel}</Text>
        {subtitleText ? <Text style={styles.subtitle}>{subtitleText}</Text> : null}
        <View style={styles.hairline} />
        <Text style={styles.teaser} numberOfLines={3}>
          {teaser}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FAF8F5',
    borderRadius: kolmiRadius.lg,
    borderWidth: 1,
    borderColor: kolmiColors.outline,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.94,
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: kolmiColors.surfaceSoft,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: kolmiSpace.lg,
    gap: kolmiSpace.xxs,
  },
  name: {
    fontFamily: kolmiFonts.serif,
    fontSize: fontScale(28),
    color: kolmiColors.text,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  maison: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 14,
    color: kolmiColors.accent,
    letterSpacing: 0.1,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: kolmiFonts.ui,
    fontSize: 14,
    color: kolmiColors.textBody,
    marginTop: 2,
  },
  hairline: {
    width: 32,
    height: 0.6,
    backgroundColor: 'rgba(139,26,26,0.4)',
    marginVertical: kolmiSpace.sm,
  },
  teaser: {
    fontFamily: kolmiFonts.serifItalic,
    fontSize: 16,
    lineHeight: 22,
    color: kolmiColors.text,
  },
})

export default React.memo(SelectedProfileCard)
