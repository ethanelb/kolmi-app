import React from 'react'
import { Tabs } from 'expo-router'
import { Platform, View } from 'react-native'
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg'
import { kolmiColors, kolmiFonts } from '@/constants/kolmiTheme'

const ACTIVE = kolmiColors.accent
const INACTIVE = 'rgba(22, 19, 15, 0.45)'

type IconProps = { color: string; focused: boolean }

function SelectionIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L13.7 8.4L20.5 9.1L15.3 13.4L17 19.7L12 16.4L7 19.7L8.7 13.4L3.5 9.1L10.3 8.4L12 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

// Icône Archives — pile de livres / dossiers, en cohérence avec
// le pivot du tab vers "Vos envois passés".
function ArchivesIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={6} width={16} height={3.2} rx={0.8} stroke={color} strokeWidth={1.6} fill="none" />
      <Rect x={4} y={11.2} width={16} height={3.2} rx={0.8} stroke={color} strokeWidth={1.6} fill="none" />
      <Rect x={4} y={16.4} width={16} height={3.2} rx={0.8} stroke={color} strokeWidth={1.6} fill="none" />
    </Svg>
  )
}

function DatesIcon({ color }: IconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3.5}
        y={5}
        width={17}
        height={15}
        rx={2}
        stroke={color}
        strokeWidth={1.6}
      />
      <Line x1={3.5} y1={10} x2={20.5} y2={10} stroke={color} strokeWidth={1.6} />
      <Line x1={8} y1={3} x2={8} y2={7} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={7} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}

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
        name="index"
        options={{
          title: 'Sélection',
          tabBarIcon: ({ color, focused }) => (
            <SelectionIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Archives',
          tabBarIcon: ({ color, focused }) => (
            <ArchivesIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dates"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ color, focused }) => (
            <DatesIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <ProfileIcon color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}
