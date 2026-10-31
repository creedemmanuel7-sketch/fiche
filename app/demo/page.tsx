'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  ThumbsUp,
  Check,
  RotateCcw,
  Play,
  Pause,
  Copy,
  Sparkles,
  Loader2,
  Terminal,
  MessageCircle,
  Volume2,
  VolumeX,
} from 'lucide-react'

// Curseur virtuel animé SVG
function VirtualCursor({ x, y, isClicking }: { x: number; y: number; isClicking: boolean }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50 flex items-start"
      animate={{
        x,
        y,
        scale: isClicking ? 0.82 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 28,
      }}
    >
      <svg
        className="w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="#0A0A0A"
        strokeWidth="1.5"
      >
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      </svg>
      {isClicking && (
        <motion.span
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute -top-1 -left-1 w-8 h-8 rounded-full border-2 border-accent"
        />
      )}
    </motion.div>
  )
}

export default function DemoPage() {
  const router = useRouter()
  const [time, setTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const animRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(performance.now())

  // Références Audio
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const typeRef = useRef<HTMLAudioElement | null>(null)
  const clickRef = useRef<HTMLAudioElement | null>(null)
  const successRef = useRef<HTMLAudioElement | null>(null)

  // Suivi des déclenchements sonores ponctuels pour éviter de rejouer en continu
  const soundTriggersRef = useRef({
    typingStarted: false,
    copyClicked: false,
    generateClicked: false,
    usefulClicked: false,
    successPlayed: false,
  })

  // Initialisation des objets Audio
  useEffect(() => {
    bgmRef.current = new Audio('/sounds/bgm.mp3')
    bgmRef.current.loop = true
    bgmRef.current.volume = 0.2

    typeRef.current = new Audio('/sounds/type.mp3')
    typeRef.current.loop = true
    typeRef.current.volume = 0.35

    clickRef.current = new Audio('/sounds/click.mp3')
    clickRef.current.volume = 0.5

    successRef.current = new Audio('/sounds/success.mp3')
    successRef.current.volume = 0.55

    return () => {
      // Nettoyage complet à la sortie
      if (bgmRef.current) {
        bgmRef.current.pause()
        bgmRef.current.src = ''
      }
      if (typeRef.current) {
        typeRef.current.pause()
        typeRef.current.src = ''
      }
      if (clickRef.current) {
        clickRef.current.pause()
        clickRef.current.src = ''
      }
      if (successRef.current) {
        successRef.current.pause()
        successRef.current.src = ''
      }
    }
  }, [])

  // Gestion du volume Mute / Unmute
  useEffect(() => {
    if (bgmRef.current) bgmRef.current.muted = isMuted
    if (typeRef.current) typeRef.current.muted = isMuted
    if (clickRef.current) clickRef.current.muted = isMuted
    if (successRef.current) successRef.current.muted = isMuted
  }, [isMuted])

  // Déclencheur son de clic
  const playClickSound = useCallback(() => {
    if (isMuted || !clickRef.current) return
    try {
      clickRef.current.currentTime = 0
      clickRef.current.play().catch(() => {})
    } catch {}
  }, [isMuted])

  // Déclencheur son de succès
  const playSuccessSound = useCallback(() => {
    if (isMuted || !successRef.current) return
    try {
      successRef.current.currentTime = 0
      successRef.current.play().catch(() => {})
    } catch {}
  }, [isMuted])

  // Gestion de la BGM selon Play / Pause
  useEffect(() => {
    if (!bgmRef.current) return
    if (isPlaying && time < 30) {
      bgmRef.current.play().catch(() => {
        // En attente d'interaction utilisateur (politique autoplay navigateur)
      })
    } else {
      bgmRef.current.pause()
      if (typeRef.current) typeRef.current.pause()
    }
  }, [isPlaying, time])

  // Scène active calculée selon la durée totale de 30 secondes :
  // - 0s à 6s   : Intro "Le savoir se perd..." + Mockup WhatsApp (frappe lente)
  // - 6s à 10s  : Disparition de la bulle WhatsApp
  // - 10s à 15s : Interface Fiche, collage du texte, clic "Générer"
  // - 15s à 20s : Effet scan laser long
  // - 20s à 25s : Révélation de la Fiche, clic "Utile" + Toast succès
  // - 25s à 30s : Logo Fiche, slogan, appel final typewriter
  const currentScene =
    time < 6 ? 1 : time < 10 ? 2 : time < 15 ? 3 : time < 20 ? 4 : time < 25 ? 5 : 6

  // Déclenchement synchronisé des effets sonores selon l'avancement exact du temps
  useEffect(() => {
    if (!isPlaying) return

    // 1. Son de frappe (WhatsApp : de 2.6s à 5.4s)
    if (time >= 2.6 && time < 5.4) {
      if (!soundTriggersRef.current.typingStarted && typeRef.current && !isMuted) {
        soundTriggersRef.current.typingStarted = true
        typeRef.current.currentTime = 0
        typeRef.current.play().catch(() => {})
      }
    } else {
      if (soundTriggersRef.current.typingStarted && typeRef.current) {
        typeRef.current.pause()
        soundTriggersRef.current.typingStarted = false
      }
    }

    // 2. Son de clic Copier WhatsApp (à 5.5s)
    if (time >= 5.5 && !soundTriggersRef.current.copyClicked) {
      soundTriggersRef.current.copyClicked = true
      playClickSound()
    }

    // 3. Son de clic Générer (à 13.5s)
    if (time >= 13.5 && !soundTriggersRef.current.generateClicked) {
      soundTriggersRef.current.generateClicked = true
      playClickSound()
    }

    // 4. Son de clic Utile (à 23.5s)
    if (time >= 23.5 && !soundTriggersRef.current.usefulClicked) {
      soundTriggersRef.current.usefulClicked = true
      playClickSound()
    }

    // 5. Son de succès Toast (à 23.8s)
    if (time >= 23.8 && !soundTriggersRef.current.successPlayed) {
      soundTriggersRef.current.successPlayed = true
      playSuccessSound()
    }
  }, [time, isPlaying, isMuted, playClickSound, playSuccessSound])

  // Boucle 60fps via requestAnimationFrame
  useEffect(() => {
    lastTickRef.current = performance.now()

    const updateLoop = (now: number) => {
      const delta = (now - lastTickRef.current) / 1000
      lastTickRef.current = now

      if (isPlaying) {
        setTime((prev) => {
          const next = prev + delta
          if (next >= 30) {
            setIsPlaying(false)
            if (bgmRef.current) bgmRef.current.pause()
            if (typeRef.current) typeRef.current.pause()
            return 30
          }
          return next
        })
      }
      animRef.current = requestAnimationFrame(updateLoop)
    }

    animRef.current = requestAnimationFrame(updateLoop)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [isPlaying])

  // Raccourcis clavier (Espace = Play/Pause, Échap = Quitter, R = Rejouer, M = Mute)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      } else if (e.code === 'Escape') {
        e.preventDefault()
        router.push('/')
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault()
        handleReplay()
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault()
        setIsMuted((m) => !m)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleReplay = useCallback(() => {
    soundTriggersRef.current = {
      typingStarted: false,
      copyClicked: false,
      generateClicked: false,
      usefulClicked: false,
      successPlayed: false,
    }
    setTime(0)
    setIsPlaying(true)
    lastTickRef.current = performance.now()
    if (bgmRef.current && !isMuted) {
      bgmRef.current.currentTime = 0
      bgmRef.current.play().catch(() => {})
    }
  }, [isMuted])

  const jumpToTime = (targetTime: number) => {
    soundTriggersRef.current = {
      typingStarted: false,
      copyClicked: targetTime >= 5.5,
      generateClicked: targetTime >= 13.5,
      usefulClicked: targetTime >= 23.5,
      successPlayed: targetTime >= 23.8,
    }
    setTime(targetTime)
    lastTickRef.current = performance.now()
    if (bgmRef.current && isPlaying && !isMuted) {
      bgmRef.current.play().catch(() => {})
    }
  }

  // Positionnement du curseur virtuel SVG
  let cursorX = -100
  let cursorY = -100
  let cursorClicking = false

  if (typeof window !== 'undefined') {
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2

    if (time >= 4.4 && time < 5.9) {
      // Scène 1 : Se dirige vers le bouton Copier WhatsApp
      const progress = Math.min(1, (time - 4.4) / 1.0)
      cursorX = cx + 80 + progress * 60
      cursorY = cy + 25 - progress * 40
      if (time >= 5.4 && time <= 5.7) {
        cursorClicking = true
      }
    } else if (time >= 12.2 && time < 14.2) {
      // Scène 3 : Se dirige vers le bouton Générer
      const progress = Math.min(1, (time - 12.2) / 1.2)
      cursorX = cx - 40 + progress * 80
      cursorY = cy + 80 + progress * 30
      if (time >= 13.4 && time <= 13.8) {
        cursorClicking = true
      }
    } else if (time >= 22.0 && time < 24.2) {
      // Scène 5 : Se dirige vers le bouton Utile
      const progress = Math.min(1, (time - 22.0) / 1.4)
      cursorX = cx - 120 + progress * 160
      cursorY = cy + 120 + progress * 35
      if (time >= 23.4 && time <= 23.8) {
        cursorClicking = true
      }
    }
  }

  // Scène 1 : Frappe lente WhatsApp (2.6s à 5.4s)
  const fullQuestion = "Comment régler l'erreur EADDRINUSE sur Node.js ?"
  const scene1Duration = 2.8
  const scene1Elapsed = Math.max(0, time - 2.6)
  const scene1CharCount = Math.min(
    fullQuestion.length,
    Math.floor((scene1Elapsed / scene1Duration) * fullQuestion.length)
  )
  const scene1Typed = fullQuestion.slice(0, scene1CharCount)
  const isCopied = time >= 5.5

  // Scène 3 : Collage question (10.2s à 11.5s)
  const scene3Elapsed = Math.max(0, time - 10.2)
  const scene3CharCount = Math.min(
    fullQuestion.length,
    Math.floor((scene3Elapsed / 1.0) * fullQuestion.length)
  )
  const scene3Pasted = fullQuestion.slice(0, scene3CharCount)
  const isGenerating = time >= 13.5 && time < 15.0

  // Scène 5 : Utile & Toast (23.5s à 25.0s)
  const isUsefulClicked = time >= 23.5
  const showToast = time >= 23.7 && time < 25.0

  // Scène 6 : URL typewriter (26.5s à 29.5s)
  const fullUrl = "Disponible sur fiche-pi.vercel.app"
  const scene6Elapsed = Math.max(0, time - 26.5)
  const scene6CharCount = Math.min(
    fullUrl.length,
    Math.floor((scene6Elapsed / 2.0) * fullUrl.length)
  )
  const scene6TypedUrl = fullUrl.slice(0, scene6CharCount)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0A0A] text-[#EDEDED] font-sans select-none flex flex-col justify-between">
      {/* Fond sombre immersif avec dégradé radial et grille discrète */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#108966]/10 via-[#0A0A0A] to-[#0A0A0A] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* Curseur virtuel */}
      {cursorX > 0 && <VirtualCursor x={cursorX} y={cursorY} isClicking={cursorClicking} />}

      {/* Barre supérieure : Indicateur de scène & Contrôles Audio */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-[#262626]/40 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#108966] animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
              Démo 30s • Sans voix off
            </span>
          </div>
          <span className="text-xs text-[#737373] hidden sm:inline">|</span>
          <span className="text-xs text-[#EDEDED] font-medium hidden sm:inline">
            {time < 2.5 && '0s-2.5s : Le savoir se perd...'}
            {time >= 2.5 && time < 6 && '2.5s-6s : Question WhatsApp brute'}
            {time >= 6 && time < 10 && '6s-10s : Disparition du message'}
            {time >= 10 && time < 15 && '10s-15s : Collage & Génération Fiche'}
            {time >= 15 && time < 20 && '15s-20s : Analyse & Scan Laser IA'}
            {time >= 20 && time < 25 && '20s-25s : Révélation Fiche & Vote Utile'}
            {time >= 25 && '25s-30s : Fiche — Logo & Appel à l’action'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Bouton Mute / Unmute */}
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border transition-colors ${
              isMuted
                ? 'bg-red-950/40 text-red-400 border-red-800/50 hover:bg-red-900/40'
                : 'bg-[#141414] text-[#108966] border-[#262626] hover:bg-[#1A1A1A]'
            }`}
            title="Activer ou couper le son [Touche M]"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMuted ? 'Muet' : 'Son actif'}</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-xs text-[#A3A3A3] hover:text-[#EDEDED] px-2.5 py-1 rounded border border-[#262626] hover:bg-[#1A1A1A] transition-colors"
          >
            Quitter [Échap]
          </button>
        </div>
      </header>

      {/* ZONE CENTRALE : Les Scènes calibrées sur 30s */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8">
        <AnimatePresence mode="wait">
          {/* ======================================================== */}
          {/* SCÈNE 1 (0s - 6s) : "Le savoir se perd..." puis WhatsApp */}
          {/* ======================================================== */}
          {currentScene === 1 && (
            <motion.div
              key="scene-1-container"
              className="w-full flex items-center justify-center"
            >
              {time < 2.5 ? (
                /* Écran noir avec le texte "Le savoir se perd..." en fondu */
                <motion.div
                  key="intro-quote"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  className="text-center space-y-3 max-w-lg px-4"
                >
                  <p className="text-2xl sm:text-3xl font-light text-[#EDEDED] tracking-wide leading-relaxed">
                    « Le savoir se perd dans les groupes de discussion... »
                  </p>
                  <p className="text-xs text-[#A3A3A3] tracking-widest uppercase">
                    Une solution posée une fois, oubliée le lendemain.
                  </p>
                </motion.div>
              ) : (
                /* Mockup WhatsApp avec texte qui s'écrit lentement */
                <motion.div
                  key="scene-whatsapp"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, filter: 'blur(6px)', transition: { duration: 0.5 } }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="w-full max-w-md bg-[#111B21] border border-[#222E35] rounded-2xl shadow-2xl overflow-hidden"
                >
                  <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between text-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold leading-tight">Groupe Dev Lomé 🇹🇬</h3>
                        <p className="text-[11px] text-white/80">en ligne</p>
                      </div>
                    </div>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/90 font-mono">
                      WhatsApp
                    </span>
                  </div>

                  <div className="p-6 bg-[#0B141A] space-y-4 min-h-[220px] flex flex-col justify-center">
                    <div className="relative self-start max-w-[90%] bg-[#005C4B] text-white p-3.5 rounded-lg rounded-tl-xs shadow-md space-y-2">
                      <span className="text-[11px] font-semibold text-[#53BDEB] block">Junior Dev</span>
                      <p className="text-sm leading-relaxed font-sans min-h-[42px]">
                        {scene1Typed}
                        {time < 5.4 && <span className="inline-block w-1.5 h-3.5 bg-white ml-0.5 animate-pulse" />}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-white/70">
                        <span>14:32</span>
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                            isCopied
                              ? 'bg-[#108966] text-white shadow-sm'
                              : 'bg-black/30 hover:bg-black/50 text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCÈNE 2 (6s - 10s) : Transition / La bulle s'efface */}
          {/* ======================================================== */}
          {currentScene === 2 && (
            <motion.div
              key="scene-2-transition"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center space-y-3 max-w-md px-4"
            >
              <div className="w-12 h-12 mx-auto rounded-full bg-[#108966]/10 border border-[#108966]/30 flex items-center justify-center text-[#108966]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium text-[#EDEDED]">
                Transformation en cours...
              </h3>
              <p className="text-xs text-[#737373]">
                Fiche transforme les questions brutes en capital réutilisable.
              </p>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCÈNE 3 (10s - 15s) : Interface Fiche & Clic Générer */}
          {/* ======================================================== */}
          {currentScene === 3 && (
            <motion.div
              key="scene-3-generator"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
              transition={{ duration: 0.4 }}
              className="relative w-full max-w-xl bg-[#121212] border border-[#262626] rounded-xl p-6 shadow-2xl overflow-hidden space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                  <Sparkles className="w-4 h-4 text-[#108966]" />
                  <span>Structurer par l'IA</span>
                </div>
                <span className="text-[11px] bg-[#0A261D] text-[#108966] px-2.5 py-0.5 rounded-full font-medium">
                  Gemini API
                </span>
              </div>

              {/* Champ collé */}
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3] font-medium">Question brute collée :</label>
                <div className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg p-3.5 text-sm text-[#EDEDED] font-mono min-h-[70px] relative">
                  {scene3Pasted || (
                    <span className="text-[#737373]">Colle ta question ici...</span>
                  )}
                  {time >= 10.2 && time < 11.5 && (
                    <span className="inline-block w-2 h-4 bg-[#108966] ml-1 animate-pulse align-middle" />
                  )}
                </div>
              </div>

              {/* Bouton Générer avec Pulsation */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#737373]">
                  {isGenerating ? (
                    <span className="inline-flex items-center gap-2 text-[#108966]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Lancement du modèle Gemini...
                    </span>
                  ) : (
                    <span>Prêt à structurer</span>
                  )}
                </div>

                <motion.button
                  type="button"
                  animate={{
                    boxShadow:
                      time >= 12.0 && time < 13.5
                        ? [
                            '0 0 0 rgba(16, 137, 102, 0)',
                            '0 0 25px rgba(16, 137, 102, 0.7)',
                            '0 0 0 rgba(16, 137, 102, 0)',
                          ]
                        : '0 0 0 rgba(16, 137, 102, 0)',
                    scale: time >= 13.4 && time <= 13.8 ? 0.94 : 1,
                  }}
                  transition={{
                    boxShadow: { duration: 1.0, repeat: Infinity },
                    scale: { duration: 0.15 },
                  }}
                  className="bg-[#108966] text-white px-5 py-2.5 rounded-md text-xs font-semibold inline-flex items-center gap-2 shadow-lg hover:bg-[#108966]/90 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Générer la fiche</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCÈNE 4 (15s - 20s) : Effet Laser Scan long */}
          {/* ======================================================== */}
          {currentScene === 4 && (
            <motion.div
              key="scene-4-scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-full max-w-xl bg-[#121212] border border-[#262626] rounded-xl p-8 shadow-2xl overflow-hidden flex flex-col items-center justify-center space-y-6 min-h-[300px]"
            >
              {/* Effet Laser Scan oscillant sur 5 secondes */}
              <motion.div
                animate={{
                  top: ['0%', '98%', '0%'],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#108966] to-transparent shadow-[0_0_25px_#108966] pointer-events-none z-30"
              />

              <div className="w-14 h-14 rounded-full bg-[#0A261D] border border-[#108966]/50 flex items-center justify-center text-[#108966]">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>

              <div className="text-center space-y-2">
                <h4 className="text-base font-semibold text-[#EDEDED]">
                  Structuration intelligente par Gemini
                </h4>
                <p className="text-xs text-[#A3A3A3] max-w-xs mx-auto">
                  Extraction du titre, isolation du problème racine, synthèse de la solution éprouvée et étiquetage technique.
                </p>
              </div>

              <div className="flex gap-2">
                <span className="text-[10px] bg-[#1A1A1A] border border-[#262626] text-[#A3A3A3] px-2 py-0.5 rounded">
                  Schema JSON strict
                </span>
                <span className="text-[10px] bg-[#0A261D] text-[#108966] px-2 py-0.5 rounded">
                  Qualité Senior
                </span>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCÈNE 5 (20s - 25s) : La Fiche finale & Clic Utile */}
          {/* ======================================================== */}
          {currentScene === 5 && (
            <motion.div
              key="scene-5-fiche"
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, filter: 'blur(8px)', transition: { duration: 0.4 } }}
              transition={{
                type: 'spring',
                stiffness: 140,
                damping: 15,
                mass: 0.9,
              }}
              className="relative w-full max-w-2xl bg-[#121212] border border-[#262626] rounded-xl p-6 sm:p-8 shadow-2xl space-y-5"
            >
              {/* Entête */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="flex items-center justify-between text-xs text-[#A3A3A3]"
              >
                <span>Par Senior Dev • Lomé</span>
                <span className="bg-[#0A261D] text-[#108966] px-2.5 py-0.5 rounded-full font-medium">
                  Fiche Capitalisée
                </span>
              </motion.div>

              {/* Titre */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="text-xl sm:text-2xl font-bold text-[#EDEDED] leading-snug"
              >
                Résoudre l'erreur EADDRINUSE sur un port Node.js
              </motion.h2>

              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="flex flex-wrap gap-2"
              >
                {['Node.js', 'Terminal', 'Port 3000'].map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#0A261D] text-[#108966] text-xs px-2.5 py-0.5 rounded-full font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>

              {/* Bloc Problème */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.3 }}
                className="bg-[#1A1A1A] border-l-2 border-[#108966] p-3.5 rounded-r-md space-y-1"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3]">
                  Problème
                </span>
                <p className="text-xs sm:text-sm text-[#EDEDED]/90 leading-relaxed">
                  Un processus antérieur utilise déjà le port 3000 (instance orpheline en arrière-plan).
                  Le serveur ne peut pas s'y lier.
                </p>
              </motion.div>

              {/* Bloc Solution */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.3 }}
                className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-md space-y-2"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#108966]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Solution</span>
                </div>
                <div className="bg-[#0A0A0A] p-2.5 rounded font-mono text-xs text-[#EDEDED] border border-[#262626]">
                  <p className="text-[#A3A3A3]"># Tuer le processus sur le port 3000 :</p>
                  <p className="text-[#108966] font-semibold">lsof -i :3000 | xargs kill -9</p>
                  <p className="text-[#A3A3A3] pt-1"># Ou lancer sur un port alternatif :</p>
                  <p className="text-[#EDEDED]">PORT=3001 npm run dev</p>
                </div>
              </motion.div>

              {/* Footer Fiche avec bouton Utile */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.3 }}
                className="flex items-center justify-between pt-2 border-t border-[#262626]"
              >
                <span className="text-xs text-[#737373]">12 vues</span>

                <motion.button
                  type="button"
                  animate={{
                    scale: isUsefulClicked ? [1, 1.25, 1] : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors shadow-md ${
                    isUsefulClicked
                      ? 'bg-[#108966] text-white shadow-[#108966]/30'
                      : 'bg-[#1A1A1A] border border-[#262626] text-[#EDEDED] hover:bg-[#262626]'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${isUsefulClicked ? 'fill-current' : ''}`} />
                  <span>Utile ({isUsefulClicked ? 1 : 0})</span>
                </motion.button>
              </motion.div>

              {/* Toast de succès */}
              <AnimatePresence>
                {showToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute -bottom-14 left-1/2 -translate-x-1/2 bg-[#108966] text-white px-4 py-2 rounded-md text-xs font-semibold shadow-xl flex items-center gap-2 whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>Merci pour ton retour !</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SCÈNE 6 (25s - 30s) : Le Logo & L'Appel Final */}
          {/* ======================================================== */}
          {currentScene === 6 && (
            <motion.div
              key="scene-6-outro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6 max-w-xl px-4"
            >
              {/* Grand Logo Fiche */}
              <motion.div
                initial={{ scale: 0.78, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 90,
                  damping: 14,
                  duration: 1.0,
                }}
                className="inline-flex items-center justify-center gap-4"
              >
                <svg
                  className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 drop-shadow-[0_4px_24px_rgba(16,137,102,0.4)]"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="32" height="32" rx="7" fill="#EDEDED" />
                  <text
                    x="7"
                    y="24"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    fontSize="22"
                    fontWeight="800"
                    fill="#0A0A0A"
                  >
                    F
                  </text>
                  <rect x="20" y="7" width="5.5" height="5.5" rx="1.5" fill="#108966" />
                </svg>
                <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#EDEDED]">
                  Fiche
                </h1>
              </motion.div>

              {/* Slogan */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-base sm:text-xl text-[#A3A3A3] font-normal leading-relaxed max-w-md mx-auto"
              >
                Le savoir technique de la communauté, structuré et capitalisé.
              </motion.p>

              {/* Typewriter URL */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="pt-4 flex items-center justify-center gap-2"
              >
                <span className="font-mono text-xs sm:text-sm text-[#108966] bg-[#0A261D] border border-[#108966]/40 px-3 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm">
                  <span>{scene6TypedUrl}</span>
                  {scene6Elapsed < 2.0 && (
                    <span className="w-1.5 h-3.5 bg-[#108966] inline-block animate-pulse" />
                  )}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BARRE INFÉRIEURE : Navigation temporelle & Contrôles */}
      <footer className="relative z-20 w-full px-6 py-4 border-t border-[#262626]/40 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Saut direct vers les 6 étapes clés */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { t: 0, label: '0s Intro' },
            { t: 3, label: '3s WhatsApp' },
            { t: 10, label: '10s Gemini' },
            { t: 15, label: '15s Scan' },
            { t: 20, label: '20s Fiche' },
            { t: 25, label: '25s Logo' },
          ].map((step) => (
            <button
              key={step.t}
              type="button"
              onClick={() => jumpToTime(step.t + 0.1)}
              className={`text-[11px] px-2 py-0.5 rounded transition-colors font-medium ${
                time >= step.t && time < step.t + 5
                  ? 'bg-[#108966] text-white'
                  : 'text-[#737373] hover:text-[#EDEDED] bg-[#141414] border border-[#262626]'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* Contrôles Play / Pause / Rejouer */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1.5 text-xs text-[#EDEDED] bg-[#1A1A1A] hover:bg-[#262626] border border-[#262626] px-3 py-1.5 rounded-md transition-all"
            title="Espace pour basculer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 text-accent" /> : <Play className="w-3.5 h-3.5 text-accent" />}
            <span>{isPlaying ? 'Pause' : 'Lecture'}</span>
          </button>

          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 text-xs text-white bg-[#108966] hover:bg-[#108966]/90 px-3 py-1.5 rounded-md font-semibold transition-all shadow-md"
            title="Touche R pour relancer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rejouer (30s)</span>
          </button>

          {/* Compteur temps / 30.0s */}
          <span className="font-mono text-xs text-[#A3A3A3] w-14 text-right">
            {time.toFixed(1)}s / 30s
          </span>
        </div>
      </footer>

      {/* Barre de progression 30s fine tout en bas */}
      <div className="w-full h-1 bg-[#1A1A1A]">
        <div
          className="h-full bg-[#108966] transition-all duration-75"
          style={{ width: `${(time / 30) * 100}%` }}
        />
      </div>
    </div>
  )
}
