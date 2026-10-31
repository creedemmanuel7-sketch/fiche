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
  ArrowRight,
  Loader2,
  Terminal,
  MessageCircle,
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
  const animRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(performance.now())

  // Scène active calculée selon le temps (0-20s)
  // Scène 1 : 0s à 4s (WhatsApp)
  // Scène 2 : 4s à 10s (IA Gemini)
  // Scène 3 : 10s à 16s (La Fiche structurée)
  // Scène 4 : 16s à 20s (Logo & Call)
  const currentScene =
    time < 4 ? 1 : time < 10 ? 2 : time < 16 ? 3 : 4

  // Gestion du cycle d'animation à 60fps via requestAnimationFrame
  useEffect(() => {
    lastTickRef.current = performance.now()

    const updateLoop = (now: number) => {
      const delta = (now - lastTickRef.current) / 1000
      lastTickRef.current = now

      if (isPlaying) {
        setTime((prev) => {
          const next = prev + delta
          if (next >= 20) {
            setIsPlaying(false)
            return 20
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

  // Raccourcis clavier (Espace = Play/Pause, Échap = Quitter, R = Rejouer)
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
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  const handleReplay = useCallback(() => {
    setTime(0)
    setIsPlaying(true)
    lastTickRef.current = performance.now()
  }, [])

  const jumpToScene = (sceneNum: number) => {
    const targetTimes = [0, 0, 4.1, 10.1, 16.1]
    setTime(targetTimes[sceneNum] || 0)
    lastTickRef.current = performance.now()
  }

  // Positionnement dynamique du curseur selon les micro-étapes
  let cursorX = -100
  let cursorY = -100
  let cursorClicking = false

  // Calcul du curseur virtuel selon la scène
  if (typeof window !== 'undefined') {
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2

    if (time >= 1.8 && time < 3.8) {
      // Scène 1 : Se dirige vers le bouton Copier
      const progress = Math.min(1, (time - 1.8) / 0.8)
      cursorX = cx + 80 + progress * 60
      cursorY = cy + 20 - progress * 40
      if (time >= 2.7 && time <= 3.2) {
        cursorClicking = true
      }
    } else if (time >= 5.8 && time < 7.4) {
      // Scène 2 : Se dirige vers le bouton Générer
      const progress = Math.min(1, (time - 5.8) / 0.8)
      cursorX = cx - 40 + progress * 80
      cursorY = cy + 80 + progress * 30
      if (time >= 6.7 && time <= 7.2) {
        cursorClicking = true
      }
    } else if (time >= 12.8 && time < 14.5) {
      // Scène 3 : Se dirige vers le bouton "Utile"
      const progress = Math.min(1, (time - 12.8) / 0.8)
      cursorX = cx - 120 + progress * 160
      cursorY = cy + 120 + progress * 35
      if (time >= 13.6 && time <= 14.1) {
        cursorClicking = true
      }
    }
  }

  // Données de frappe pour la question
  const fullQuestion = "Comment régler l'erreur EADDRINUSE sur Node.js ?"
  const scene1CharCount = Math.min(fullQuestion.length, Math.floor((time / 2.0) * fullQuestion.length))
  const scene1Typed = fullQuestion.slice(0, scene1CharCount)
  const isCopied = time >= 2.9 && time < 4.0

  // Scène 2 : Frappe rapide lors du collage
  const scene2Elapsed = Math.max(0, time - 4.3)
  const scene2CharCount = Math.min(fullQuestion.length, Math.floor((scene2Elapsed / 0.8) * fullQuestion.length))
  const scene2Pasted = fullQuestion.slice(0, scene2CharCount)
  const isGenerating = time >= 7.0 && time < 8.6
  const isScanning = time >= 8.6 && time < 10.0

  // Scène 3 : Vote et Toast
  const isUsefulClicked = time >= 13.8
  const showToast = time >= 14.0 && time < 16.0

  // Scène 4 : Typewriter pour l'url en bas
  const fullUrl = "Disponible sur fiche-pi.vercel.app"
  const scene4Elapsed = Math.max(0, time - 18.0)
  const scene4CharCount = Math.min(fullUrl.length, Math.floor((scene4Elapsed / 1.4) * fullUrl.length))
  const scene4TypedUrl = fullUrl.slice(0, scene4CharCount)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0A0A0A] text-[#EDEDED] font-sans select-none flex flex-col justify-between">
      {/* Fond subtil avec grille discrète */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#108966]/10 via-[#0A0A0A] to-[#0A0A0A] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* Curseur virtuel */}
      {cursorX > 0 && <VirtualCursor x={cursorX} y={cursorY} isClicking={cursorClicking} />}

      {/* Barre supérieure : Indicateur de scène discret */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-[#262626]/40 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#108966] animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-[#A3A3A3]">
              Démo Produit • 20s
            </span>
          </div>
          <span className="text-xs text-[#737373] hidden sm:inline">|</span>
          <span className="text-xs text-[#EDEDED] font-medium hidden sm:inline">
            {currentScene === 1 && 'Scène 1 : La question brute (WhatsApp)'}
            {currentScene === 2 && 'Scène 2 : La structuration IA (Gemini)'}
            {currentScene === 3 && 'Scène 3 : La fiche capitalisée & vote utile'}
            {currentScene === 4 && 'Scène 4 : Fiche — Le savoir capitalisé'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-xs text-[#A3A3A3] hover:text-[#EDEDED] px-2.5 py-1 rounded border border-[#262626] hover:bg-[#1A1A1A] transition-colors"
        >
          Quitter [Échap]
        </button>
      </header>

      {/* ZONE CENTRALE : Les 4 Scènes */}
      <div className="relative flex-1 flex items-center justify-center p-4 sm:p-8">
        <AnimatePresence mode="wait">
          {/* ======================================================== */}
          {/* SCÈNE 1 (0s - 4s) : Le Problème (WhatsApp) */}
          {/* ======================================================== */}
          {currentScene === 1 && (
            <motion.div
              key="scene-1"
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, filter: 'blur(6px)', transition: { duration: 0.4 } }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="w-full max-w-md bg-[#111B21] border border-[#222E35] rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* WhatsApp Header Mockup */}
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

              {/* Message Area */}
              <div className="p-6 bg-[#0B141A] space-y-4 min-h-[220px] flex flex-col justify-center">
                <div className="relative self-start max-w-[90%] bg-[#005C4B] text-white p-3.5 rounded-lg rounded-tl-xs shadow-md space-y-2">
                  <span className="text-[11px] font-semibold text-[#53BDEB] block">Junior Dev</span>
                  <p className="text-sm leading-relaxed font-sans min-h-[42px]">
                    {scene1Typed}
                    {time < 2.0 && <span className="inline-block w-1.5 h-3.5 bg-white ml-0.5 animate-pulse" />}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-white/70">
                    <span>14:32</span>
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                        isCopied
                          ? 'bg-[#108966] text-white'
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

          {/* ======================================================== */}
          {/* SCÈNE 2 (4s - 10s) : L'IA (Gemini) */}
          {/* ======================================================== */}
          {currentScene === 2 && (
            <motion.div
              key="scene-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
              transition={{ duration: 0.4 }}
              className="relative w-full max-w-xl bg-[#121212] border border-[#262626] rounded-xl p-6 shadow-2xl overflow-hidden space-y-6"
            >
              {/* Effet Laser Scan animé symbolisant l'IA qui scanne */}
              {isScanning && (
                <motion.div
                  initial={{ top: '-10%' }}
                  animate={{ top: '110%' }}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#108966] to-transparent shadow-[0_0_20px_#108966] pointer-events-none z-30"
                />
              )}

              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
                  <Sparkles className="w-4 h-4 text-[#108966]" />
                  <span>Transformation IA en cours</span>
                </div>
                <span className="text-[11px] bg-[#0A261D] text-[#108966] px-2 py-0.5 rounded-full font-medium">
                  Gemini API
                </span>
              </div>

              {/* Champ "Colle ta question ici" */}
              <div className="space-y-2">
                <label className="text-xs text-[#A3A3A3] font-medium">Question brute collée :</label>
                <div className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg p-3.5 text-sm text-[#EDEDED] font-mono min-h-[70px] relative">
                  {scene2Pasted || (
                    <span className="text-[#737373]">Colle ta question ici...</span>
                  )}
                  {time >= 4.3 && time < 5.8 && (
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
                      Extraction du problème et de la solution...
                    </span>
                  ) : isScanning ? (
                    <span className="text-[#108966]">Formatage de la fiche markdown...</span>
                  ) : (
                    <span>Prêt à structurer</span>
                  )}
                </div>

                <motion.button
                  type="button"
                  animate={{
                    boxShadow:
                      time >= 5.8 && time < 7.0
                        ? [
                            '0 0 0 rgba(16, 137, 102, 0)',
                            '0 0 25px rgba(16, 137, 102, 0.7)',
                            '0 0 0 rgba(16, 137, 102, 0)',
                          ]
                        : '0 0 0 rgba(16, 137, 102, 0)',
                    scale: time >= 6.8 && time <= 7.2 ? 0.94 : 1,
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
          {/* SCÈNE 3 (10s - 16s) : La Révélation (La Fiche) */}
          {/* ======================================================== */}
          {currentScene === 3 && (
            <motion.div
              key="scene-3"
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
              {/* Entête de fiche (staggered 1) */}
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

              {/* Titre clair (staggered 2) */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="text-xl sm:text-2xl font-bold text-[#EDEDED] leading-snug"
              >
                Résoudre l'erreur EADDRINUSE sur un port Node.js
              </motion.h2>

              {/* Tags (staggered 3) */}
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

              {/* Bloc Problème (staggered 4) */}
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

              {/* Bloc Solution (staggered 5) */}
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

              {/* Footer Fiche avec bouton "Utile" animé (staggered 6) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.3 }}
                className="flex items-center justify-between pt-2 border-t border-[#262626]"
              >
                <span className="text-xs text-[#737373]">12 vues</span>

                {/* Bouton Utile avec Pop Animation */}
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

              {/* Toast Vert "Merci pour ton retour" */}
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
          {/* SCÈNE 4 (16s - 20s) : Le Logo & L'Appel */}
          {/* ======================================================== */}
          {currentScene === 4 && (
            <motion.div
              key="scene-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6 max-w-xl px-4"
            >
              {/* Grand Logo Fiche avec zoom scale-in lent */}
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
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-base sm:text-xl text-[#A3A3A3] font-normal leading-relaxed max-w-md mx-auto"
              >
                Le savoir technique de la communauté, structuré et capitalisé.
              </motion.p>

              {/* Lien Machine à écrire */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="pt-4 flex items-center justify-center gap-2"
              >
                <span className="font-mono text-xs sm:text-sm text-[#108966] bg-[#0A261D] border border-[#108966]/40 px-3 py-1.5 rounded-full inline-flex items-center gap-2 shadow-sm">
                  <span>{scene4TypedUrl}</span>
                  {scene4Elapsed < 1.4 && (
                    <span className="w-1.5 h-3.5 bg-[#108966] inline-block animate-pulse" />
                  )}
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BARRE INFÉRIEURE : Commandes et timeline */}
      <footer className="relative z-20 w-full px-6 py-4 border-t border-[#262626]/40 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation rapide par scène */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: '1. WhatsApp' },
            { num: 2, label: '2. Gemini IA' },
            { num: 3, label: '3. Fiche structurée' },
            { num: 4, label: '4. Logo & Appel' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => jumpToScene(s.num)}
              className={`text-xs px-2.5 py-1 rounded transition-colors font-medium ${
                currentScene === s.num
                  ? 'bg-[#108966] text-white'
                  : 'text-[#737373] hover:text-[#EDEDED] bg-[#141414] border border-[#262626]'
              }`}
            >
              {s.label}
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
            <span>Rejouer l'animation</span>
          </button>

          {/* Compteur temps /20s */}
          <span className="font-mono text-xs text-[#A3A3A3] w-12 text-right">
            {time.toFixed(1)}s
          </span>
        </div>
      </footer>

      {/* Barre de progression fine tout en bas */}
      <div className="w-full h-1 bg-[#1A1A1A]">
        <div
          className="h-full bg-[#108966] transition-all duration-75"
          style={{ width: `${(time / 20) * 100}%` }}
        />
      </div>
    </div>
  )
}
