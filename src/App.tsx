import { useEffect, useRef, useState } from 'react'
import './App.css'
import yesSound from './assets/domino-7058588216890247937.mp3'
import celebrationGif from './assets/dance-hiphop.gif'
import sadSound from './assets/breakin my heart-7043251373139364655.mp3'
import sadGif from './assets/sad-cat-cat-in-front-of-sea.gif' 

function App() {
  type Heart = { id: number; left: number; top: number; dur: number; delay: number; scale: number; sizePx: number }
  type BadEmoji = { id: number; left: number; top: number; dur: number; delay: number; scale: number; sizePx: number; emoji: string }
  type Mood = 'happy' | 'sad'

  const [message, setMessage] = useState<string>('')
  const [hearts, setHearts] = useState<Heart[]>([])
  const [badEmojis, setBadEmojis] = useState<BadEmoji[]>([])
  const [mood, setMood] = useState<Mood>('happy')
  const clickSoundRef = useRef<HTMLAudioElement | null>(null)
  const sadSoundRef = useRef<HTMLAudioElement | null>(null)
  const [showSadGif, setShowSadGif] = useState<boolean>(false)
  const sadGifTimeoutRef = useRef<number | null>(null)

  // No-button click sequence state
  const [, setNoClickCount] = useState<number>(0)
  // Yes button scale (increases each time 'No' is clicked)
  const [yesScale, setYesScale] = useState<number>(1) 

  const makeHeart = (id: number): Heart => {
    // spawn across the whole viewport (avoid exact 0/100 to prevent clipping)
    const left = 2 + Math.random() * 96 // 2% - 98%
    const top = 2 + Math.random() * 96  // 2% - 98%
    // longer and more varied durations for background feel
    const dur = 6 + Math.random() * 8   // 6s - 14s
    const delay = Math.random() * 2.5
    const scale = 0.9 + Math.random() * 0.35
    const sizePx = Math.round(scale * 28)
    return { id, left, top, dur, delay, scale, sizePx }
  }

  const badPool = ['🌧️','⛈️','😢','😞','😩','💔','😔','☔️','😿']
  const makeBadEmoji = (id: number): BadEmoji => {
    const left = 2 + Math.random() * 96 // 2% - 98%
    const top = 2 + Math.random() * 96  // spawn anywhere on viewport 2% - 98%
    const dur = 5 + Math.random() * 10  // 5s - 15s falling
    const delay = Math.random() * 2.5
    const scale = 0.75 + Math.random() * 0.6
    const sizePx = Math.round(scale * 26)
    const emoji = badPool[Math.floor(Math.random() * badPool.length)]
    return { id, left, top, dur, delay, scale, sizePx, emoji }
  }

  useEffect(() => {
    // initial floating hearts (attributes fixed on creation)
    setHearts(Array.from({ length: 18 }, (_, i) => makeHeart(i)))
    // preload click sound for the "Yes" button
    try {
      clickSoundRef.current = new Audio(yesSound)
      clickSoundRef.current.preload = 'auto'
      clickSoundRef.current.volume = 0.9
    } catch (e) {
      // ignore audio setup errors
      clickSoundRef.current = null
    }

    // preload sad sound for the "No" button
    try {
      sadSoundRef.current = new Audio(sadSound)
      sadSoundRef.current.preload = 'auto'
      sadSoundRef.current.volume = 0.95
    } catch (e) {
      sadSoundRef.current = null
    }
  }, [])

  function spawnHearts(n = 8) {
    setHearts((prev) => {
      const max = prev.length ? Math.max(...prev.map((h) => h.id)) : 0
      return [...prev, ...Array.from({ length: n }, (_, i) => makeHeart(max + i + 1))]
    })
    // cleanup after a while (allow long animations to finish)
    setTimeout(() => {
      setHearts((prev) => prev.slice(Math.max(0, prev.length - 24)))
    }, 16000)
  }

  function spawnBadEmojis(n = 12) {
    setBadEmojis((prev) => {
      const max = prev.length ? Math.max(...prev.map((b) => b.id)) : 0
      return [...prev, ...Array.from({ length: n }, (_, i) => makeBadEmoji(max + i + 1))]
    })
    // cleanup after a while
    setTimeout(() => {
      setBadEmojis((prev) => prev.slice(Math.max(0, prev.length - 40)))
    }, 18000)
  }

  const [showGif, setShowGif] = useState(false)
  const gifTimeoutRef = useRef<number | null>(null)

  // Generic media helpers
  const playAudio = (ref: React.MutableRefObject<HTMLAudioElement | null>, src: string, volume = 0.9) => {
    try {
      if (ref && ref.current) {
        ref.current.currentTime = 0
        void ref.current.play()
      } else {
        const a = new Audio(src)
        a.volume = volume
        void a.play()
      }
    } catch (e) {
      // ignore playback exceptions
    }
  }

  const stopAudio = (ref: React.MutableRefObject<HTMLAudioElement | null>) => {
    try {
      if (ref && ref.current) {
        ref.current.pause()
        ref.current.currentTime = 0
      }
    } catch (e) {}
  }

  const showGifFor = (
    setter: (v: boolean) => void,
    timeoutRef: React.MutableRefObject<number | null>,
    duration = 8000,
    onShow?: () => void
  ) => {
    setter(true)
    if (onShow) onShow()
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = window.setTimeout(() => {
      setter(false)
      timeoutRef.current = null
    }, duration)
  }

  const handleYes = () => {
    setMessage("Yes! 💖 I'll be yours! ✨")
    setMood('happy')
    setBadEmojis([])
    spawnHearts(85)

    // reset No-click sequence and Yes button size
    setNoClickCount(0)
    setYesScale(1)

    // stop any sad media
    try {
      stopAudio(sadSoundRef)
      if (sadGifTimeoutRef.current) {
        window.clearTimeout(sadGifTimeoutRef.current)
        sadGifTimeoutRef.current = null
      }
      setShowSadGif(false)
    } catch (e) {}

    // play yes media
    playAudio(clickSoundRef, yesSound, 0.9)
    showGifFor(setShowGif, gifTimeoutRef, 12000)
  }

  const handleNo = () => {
    // increment no-click sequence and grow Yes button
    setNoClickCount((prev) => {
      const next = prev + 1
      setYesScale((s) => Math.min(1.8, s + 0.12))

      if (next === 1) {
        setMessage('Hum seems like you misclicked')
      } else if (next === 2) {
        setMessage('Oh I see haha, very funny')
      } else if (next === 3) {
        setMessage('are you really for real ??? 😕')
        spawnBadEmojis(20)
      } else {
        // Step 4: perform sad behavior (show gif, play sad audio, spawn emojis)
        setMessage("Oh that's sad...💔")
        setMood('sad')
        setHearts([])

        // stop yes media
        try {
          stopAudio(clickSoundRef)
          if (gifTimeoutRef.current) {
            window.clearTimeout(gifTimeoutRef.current)
            gifTimeoutRef.current = null
          }
          setShowGif(false)
        } catch (e) {}

        // play sad media
        playAudio(sadSoundRef, sadSound, 0.95)

        // spawn stormy / sad emoji backdrop
        spawnBadEmojis(40)

        // show sad gif
        showGifFor(setShowSadGif, sadGifTimeoutRef, 29000)

        return 0 // reset sequence
      }
      return next
    })
  }

  return (
    <div className={`app ${mood === 'sad' ? 'sad' : ''}`} role="main">

      <div className="bad-emojis" aria-hidden>
        {badEmojis.map((b) => (
          <span
            key={b.id}
            className="bad"
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
              ['--s' as any]: b.scale,
              ['--size' as any]: `${b.sizePx}px`,
            } as React.CSSProperties}
            aria-hidden
          >
            {b.emoji}
          </span>
        ))}
      </div>

      <div className="hearts" aria-hidden>
        {hearts.map((h) => (
          <span
            key={h.id}
            className="heart"
            style={{
              left: `${h.left}%`,
              top: `${h.top}%`,
              animationDuration: `${h.dur}s`,
              animationDelay: `${h.delay}s`,
              ['--s' as any]: h.scale,
              ['--size' as any]: `${h.sizePx}px`,
            } as React.CSSProperties}
            aria-hidden
          >
            ❤️
          </span>
        ))}
      </div>

      <h1 className="title">
        <span className="title-line big">Magda, will you be my Valentine?</span>
      </h1>

      <div className="buttons">
        <button className="btn yes" onClick={handleYes} aria-label="Say yes" style={{ ['--yes-scale' as any]: yesScale } as React.CSSProperties}>Yes</button>
        <button className="btn no" onClick={handleNo} aria-label="Say no">No</button>
      </div>

      {showGif && mood === 'happy' && (
        <div className="gif-wrap" aria-hidden>
          <img src={celebrationGif} alt="Celebration" className="yes-gif" />
        </div>
      )}

      {showSadGif && mood === 'sad' && (
        <div className="gif-wrap" aria-hidden>
          <img src={sadGif} alt="Sad" className="sad-gif" />
        </div>
      )}

      <div className="message" aria-live="polite">{message}</div>
    </div>
  )
}

export default App
