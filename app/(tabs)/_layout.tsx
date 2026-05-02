import React, { useEffect, useState, useCallback } from 'react'
import { Tabs } from 'expo-router'
import { Platform, View, Text } from 'react-native'
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'
import {
  loadConversation,
  todayKey,
  isDayCompleted,
} from '@/lib/kolmi/conversationEngine'

const ACTIVE = kolmiColors.accent
const INACTIVE = 'rgba(22, 19, 15, 0.45)'

type IconProps = { color: string; focused: boolean }

// Icône archives — 3 fines lignes empilées (registre, dossiers).
function EncountersIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={6} width={16} height={3.2} rx={0.8} stroke={color} strokeWidth={1.6} fill="none" />
      <Rect x={4} y={11.2} width={16} height={3.2} rx={0.8} stroke={color} strokeWidth={1.6} fill="none" />
      <Rect x={4} y={16.4} width={16} height={3.2} rx={0.8} stroke={color} strokeWidth={1.6} fill="none" />
    </Svg>
  )
}

// Icône conversation — bulle italique avec un point bordeaux.
// Plus expressive (légèrement plus grosse) parce que c'est le tab
// central, l'entrée par défaut. Si `hot` (non-lus du jour), on dessine
// un petit point d'accent en haut-droite.
function ConversationIcon({ color, hot }: IconProps & { hot?: boolean }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
        {/* Petit fronton stylisé — clin d'œil au MaisonGlyph */}
        <Path
          d="M 13 4 L 4 11 L 22 11 Z"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
          fill="none"
        />
        <Line x1={3} y1={11} x2={23} y2={11} stroke={color} strokeWidth={1.4} />
        <Line x1={3} y1={14} x2={23} y2={14} stroke={color} strokeWidth={0.8} />
        <Circle cx={13} cy={9.4} r={0.9} fill={color} />
        {/* Sol */}
        <Line x1={1} y1={22} x2={25} y2={22} stroke={color} strokeWidth={0.8} />
      </Svg>
      {hot && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: kolmiColors.accent,
          }}
        />
      )}
    </View>
  )
}

// Icône profil — silhouette douce (cercle + arc épaules).
function ProfileIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8.5} r={4} stroke={color} strokeWidth={1.6} />
      <Path
        d="M4 21C4 16.5817 7.58172 13 12 13C16.4183 13 20 16.5817 20 21"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  )
}

export default function TabsLayout() {
  // Le tab conversation devient "hot" (point bordeaux) quand la
  // conversation du jour n'est pas encore terminée. On relit la
  // persistance au focus pour rester juste sans live store.
  const [conversationHot, setConversationHot] = useState(false)

  const refreshHot = useCallback(async () => {
    try {
      const conv = await loadConversation(todayKey())
      // Hot si conversation existe ET pas terminée OU pas encore vue.
      setConversationHot(conv ? !isDayCompleted(conv) : true)
    } catch {
      setConversationHot(true)
    }
  }, [])

  useEffect(() => {
    refreshHot()
  }, [refreshHot])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#FAF8F5',
          borderTopColor: 'rgba(22, 19, 15, 0.10)',
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: kolmiFonts.uiSemiBold,
          fontSize: 10.5,
          letterSpacing: 0.4,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="encounters"
        options={{
          title: 'Rencontres',
          tabBarIcon: ({ color, focused }) => (
            <EncountersIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="conversation"
        listeners={{
          focus: () => refreshHot(),
        }}
        options={{
          // Label minimal — c'est le tab central, le cœur, il n'a pas
          // besoin de se nommer. Un point bordeaux suffit.
          title: '·',
          tabBarLabel: ({ focused }) => (
            <Text
              style={{
                fontFamily: kolmiFonts.serif,
                fontSize: 14,
                color: focused ? ACTIVE : INACTIVE,
                marginTop: 2,
                letterSpacing: 0.4,
              }}
            >
              ·
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <ConversationIcon color={color} focused={focused} hot={conversationHot} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Vous',
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon color={color} focused={focused} />
          ),
        }}
      />

      {/* index existe toujours pour rediriger les routes legacy
          (`/(tabs)`, deeplinks anciens) vers conversation — on le
          masque de la barre, mais le fichier reste. */}
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  )
}
