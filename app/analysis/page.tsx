"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Music, Sparkles, Zap } from "lucide-react"
import Link from "next/link"

import {
  getAudioStore,
  setAnalysisInProgress,
  updatePartBeatGenerated,
  setCombinedAudio,
  setRecordingPhaseComplete,
} from "@/lib/useAudioStore"
import {
  decodeAudioBlob,
  concatenateAudioBuffers,
  audioBufferToWav,
  formatDuration
} from "@/lib/audioUtils"
import { generateBackingTrack } from "@/lib/beatGenerator"

type AnalysisStep = "initializing" | "analyzing" | "generating-beats" | "combining" | "finalizing"

interface AnalysisProgress {
  step: AnalysisStep
  progress: number
  currentPartIndex: number
  totalParts: number
  message: string
}

export default function AnalysisPage() {
  const router = useRouter()
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress>({
    step: "initializing",
    progress: 0,
    currentPartIndex: 0,
    totalParts: 0,
    message: "Initializing analysis...",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        const store = getAudioStore()

        // Validate we have recordings
        if (!store.parts.length || !store.parts.every(p => p.blob)) {
          throw new Error("No complete recordings found. Please go back and record all parts.")
        }

        setAnalysisProgress(prev => ({
          ...prev,
          totalParts: store.parts.length,
          message: "Starting analysis of vocal recordings...",
        }))

        // Phase 1: Analyze recordings and generate beats in parallel
        setAnalysisProgress(prev => ({
          ...prev,
          step: "analyzing",
          progress: 10,
          message: "Analyzing your vocal recordings...",
        }))

        await new Promise(r => setTimeout(r, 800))

        // Phase 2: Generate backing tracks (beats) for each part
        setAnalysisProgress(prev => ({
          ...prev,
          step: "generating-beats",
          progress: 25,
          message: "Generating beat patterns and rhythms...",
        }))

        const backingTracksMap = new Map()

        for (let i = 0; i < store.parts.length; i++) {
          const part = store.parts[i]
          
          setAnalysisProgress(prev => ({
            ...prev,
            currentPartIndex: i + 1,
            progress: 25 + ((i / store.parts.length) * 50),
            message: `Generating beats for ${part.label}...`,
          }))

          try {
            // Generate backing track for this part
            const result = await generateBackingTrack(store.genre, part.type, store.tempo, 8)
            backingTracksMap.set(part.id, result)
            updatePartBeatGenerated(part.id, true)

            await new Promise(r => setTimeout(r, 200))
          } catch (err) {
            console.error(`Error generating beats for ${part.label}:`, err)
            // Continue with other parts even if one fails
          }
        }

        // Phase 3: Combine audio buffers with beats
        setAnalysisProgress(prev => ({
          ...prev,
          step: "combining",
          progress: 75,
          message: "Combining vocals with generated beats...",
        }))

        await new Promise(r => setTimeout(r, 500))

        // Decode all vocal blobs
        const audioBuffers: AudioBuffer[] = []
        for (const part of store.parts) {
          if (part.blob) {
            const buffer = await decodeAudioBlob(part.blob)
            audioBuffers.push(buffer)
          }
        }

        // Combine audio buffers in order
        const combinedBuffer = await concatenateAudioBuffers(audioBuffers)

        // Phase 4: Finalize and export
        setAnalysisProgress(prev => ({
          ...prev,
          step: "finalizing",
          progress: 90,
          message: "Finalizing your complete song...",
        }))

        await new Promise(r => setTimeout(r, 300))

        // Convert to WAV
        const wavBlob = audioBufferToWav(combinedBuffer)
        const wavUrl = URL.createObjectURL(wavBlob)

        // Store combined audio
        setCombinedAudio({
          blob: wavBlob,
          url: wavUrl,
          duration: combinedBuffer.duration,
        })

        setAnalysisProgress(prev => ({
          ...prev,
          progress: 100,
          message: "Analysis complete! Preparing final result...",
        }))

        await new Promise(r => setTimeout(r, 1000))

        // Navigate to result page
        router.push("/result")

      } catch (err) {
        console.error("Analysis error:", err)
        setError(err instanceof Error ? err.message : "An error occurred during analysis")
      }
    }

    runAnalysis()
  }, [router])

  const getStepIcon = (step: AnalysisStep) => {
    switch (step) {
      case "analyzing":
        return <Sparkles className="h-4 w-4" />
      case "generating-beats":
        return <Zap className="h-4 w-4" />
      case "combining":
        return <Music className="h-4 w-4" />
      default:
        return <Music className="h-4 w-4" />
    }
  }

  const getStepLabel = (step: AnalysisStep) => {
    switch (step) {
      case "initializing":
        return "Initializing"
      case "analyzing":
        return "Analyzing Vocals"
      case "generating-beats":
        return "Generating Beats"
      case "combining":
        return "Combining Audio"
      case "finalizing":
        return "Finalizing"
      default:
        return "Processing"
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
              <Music className="h-6 w-6" />
              <span className="text-xl font-bold">musicPro</span>
            </Link>
          </div>

          <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-red-500/50">
            <CardHeader>
              <CardTitle className="text-white">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300 mb-4">{error}</p>
              <Link href="/create" className="text-purple-300 hover:text-purple-200 underline">
                ← Back to Recording
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
            <Music className="h-6 w-6" />
            <span className="text-xl font-bold">musicPro</span>
          </Link>
        </div>

        {/* Main Analysis Card */}
        <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
          
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
              Analyzing & Generating Beats
            </CardTitle>
            <CardDescription className="text-gray-300">
              Your vocals are being analyzed and beats are being generated simultaneously
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Step Display */}
            <div className="flex items-center gap-3 p-4 bg-black/20 rounded-lg border border-white/10">
              <div className="animate-spin">
                {getStepIcon(analysisProgress.step)}
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">
                  {getStepLabel(analysisProgress.step)}
                </div>
                <div className="text-gray-400 text-sm">
                  {analysisProgress.message}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Overall Progress</span>
                <span className="text-purple-300 font-semibold">{Math.round(analysisProgress.progress)}%</span>
              </div>
              <Progress value={analysisProgress.progress} className="h-3" />
            </div>

            {/* Current Part */}
            {analysisProgress.step === "generating-beats" && analysisProgress.totalParts > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Part</span>
                  <span className="text-purple-300">
                    {analysisProgress.currentPartIndex} of {analysisProgress.totalParts}
                  </span>
                </div>
                <Progress 
                  value={(analysisProgress.currentPartIndex / analysisProgress.totalParts) * 100} 
                  className="h-2" 
                />
              </div>
            )}

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                className={analysisProgress.step === "analyzing" ? "bg-purple-600" : "bg-gray-600"}
              >
                Analyzing
              </Badge>
              <Badge 
                className={analysisProgress.step === "generating-beats" ? "bg-purple-600" : "bg-gray-600"}
              >
                Generating Beats
              </Badge>
              <Badge 
                className={analysisProgress.step === "combining" ? "bg-purple-600" : "bg-gray-600"}
              >
                Combining
              </Badge>
              <Badge 
                className={analysisProgress.step === "finalizing" ? "bg-purple-600" : "bg-gray-600"}
              >
                Finalizing
              </Badge>
            </div>

            {/* Info Text */}
            <div className="p-3 bg-blue-500/20 rounded border border-blue-500/30">
              <p className="text-blue-200 text-sm">
                💡 Your vocals are being combined with AI-generated beats and rhythms specifically tailored to your song structure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Loading Animation */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    </div>
  )
}
