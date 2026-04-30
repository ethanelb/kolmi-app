import { useState, useRef, useCallback } from 'react'
import { Audio } from 'expo-av'

type RecordingState = 'idle' | 'recording' | 'stopped'

interface RecordingResult {
  uri: string
  duration: number
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [result, setResult] = useState<RecordingResult | null>(null)
  const recordingRef = useRef<Audio.Recording | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync()
      if (!granted) throw new Error('Microphone permission denied')

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      const recording = new Audio.Recording()
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY)
      await recording.startAsync()

      recordingRef.current = recording
      setDuration(0)
      setResult(null)
      setState('recording')

      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d >= 120) {
            stop()
            return d
          }
          return d + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording', err)
    }
  }, [])

  const stop = useCallback(async () => {
    if (!recordingRef.current) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      await recordingRef.current.stopAndUnloadAsync()
      const uri = recordingRef.current.getURI()
      const status = await recordingRef.current.getStatusAsync()
      const dur = status.durationMillis ? Math.round(status.durationMillis / 1000) : duration

      recordingRef.current = null
      setState('stopped')

      if (uri) {
        setResult({ uri, duration: dur })
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false })
    } catch (err) {
      console.error('Failed to stop recording', err)
    }
  }, [duration])

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    recordingRef.current = null
    setState('idle')
    setDuration(0)
    setResult(null)
  }, [])

  return { state, duration, result, start, stop, reset }
}
