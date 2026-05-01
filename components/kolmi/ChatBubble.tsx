import React from 'react'
import { Text, View } from 'react-native'
import { kolmiFonts } from '@/constants/kolmiTheme'

type Props = {
  role: 'ai' | 'user'
  text: string
}

// Editorial "correspondance privée" treatment.
// AI = typography flowing on the page (italic serif, no bubble, like a letter).
// User = small paper slip slipped back across the page (slight rotation,
// thin sepia rules top/bottom, em-dash prefix).
function ChatBubble({ role, text }: Props) {
  if (role === 'ai') return <AiLetter text={text} />
  return <UserSlip text={text} />
}

export default React.memo(ChatBubble)

function AiLetter({ text }: { text: string }) {
  return (
    <View style={{ marginVertical: 14, paddingRight: 28 }}>
      <Text
        style={{
          fontFamily: kolmiFonts.serifItalic,
          fontSize: 23,
          lineHeight: 31,
          color: '#16130F',
          letterSpacing: -0.3,
        }}
      >
        {text}
      </Text>
    </View>
  )
}

function UserSlip({ text }: { text: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-end',
        maxWidth: '78%',
        marginVertical: 12,
        marginRight: 6,
        backgroundColor: '#F4ECD6',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderTopWidth: 0.6,
        borderBottomWidth: 0.6,
        borderColor: '#5A4520',
        transform: [{ rotate: '-0.6deg' }],
        shadowColor: '#3A2814',
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 1, height: 2 },
      }}
    >
      <Text
        style={{
          fontFamily: kolmiFonts.serif,
          fontSize: 16,
          lineHeight: 22,
          color: '#1A140C',
        }}
      >
        — {text}
      </Text>
    </View>
  )
}
