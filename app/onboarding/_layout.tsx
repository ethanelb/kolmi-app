import { Stack } from 'expo-router'
import { kolmiColors } from '@/constants/kolmiTheme'

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: kolmiColors.bg },
      }}
    />
  )
}
