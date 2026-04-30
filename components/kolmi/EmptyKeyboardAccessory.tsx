import React from 'react'
import { InputAccessoryView, Platform, View } from 'react-native'

export const EMPTY_ACCESSORY_ID = 'kolmi-empty-accessory'

// Empty accessory view used to suppress iOS's default "Done" toolbar
// that appears above number-pad / phone-pad keyboards.
// Mount once per screen that has a numeric TextInput, then pass
// inputAccessoryViewID={EMPTY_ACCESSORY_ID} to the TextInput.
export default function EmptyKeyboardAccessory() {
  if (Platform.OS !== 'ios') return null
  return (
    <InputAccessoryView nativeID={EMPTY_ACCESSORY_ID}>
      <View style={{ height: 0 }} />
    </InputAccessoryView>
  )
}
