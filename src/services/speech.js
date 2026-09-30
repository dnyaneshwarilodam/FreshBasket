// Web Speech API wrapper with graceful fallback

export function isSpeechSupported() {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

export function createRecognition(lang = 'en-IN') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return null
  const recognition = new SpeechRecognition()
  recognition.lang = lang
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 1
  return recognition
}

export function startListening(onResult, onEnd, onError) {
  const recognition = createRecognition()
  if (!recognition) {
    onError?.(new Error('Speech recognition not supported'))
    return null
  }

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript)
      .join('')
    onResult(transcript, e.results[e.results.length - 1].isFinal)
  }

  recognition.onerror = (e) => onError?.(e)
  recognition.onend = () => onEnd?.()

  recognition.start()
  return recognition
}

export function stopListening(recognition) {
  if (recognition) recognition.stop()
}
