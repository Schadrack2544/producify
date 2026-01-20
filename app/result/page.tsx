"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Share2, Music, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { AudioPlayer } from "@/components/AudioPlayer"
import { formatDuration, downloadAudio } from "@/lib/audioUtils"
import {
  getAudioStore,
  clearAudioStore,
  SongPart,
  getPartTypeColor,
  getPartTypeBorderColor,
  getPartTypeBgColor
} from "@/lib/useAudioStore"

export default function ResultPage() {
  const router = useRouter()
  const [audioData, setAudioData] = useState<{
    genre: string
    combinedAudio: { blob: Blob | null; url: string | null; duration: number } | null
    parts: SongPart[]
  } | null>(null)

  const [downloadStarted, setDownloadStarted] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // Load audio data from store
  useEffect(() => {
    const store = getAudioStore()

    if (!store.combinedAudio?.url) {
      // No audio data, redirect back to create
      router.push("/create")
      return
    }

    setAudioData({
      genre: store.genre,
      combinedAudio: store.combinedAudio,
      parts: store.parts,
    })
  }, [router])

  const handleDownload = () => {
    if (!audioData?.combinedAudio?.blob) return

    setDownloadStarted(true)

    const filename = `producify-${audioData.genre}-song-${Date.now()}.wav`
    downloadAudio(audioData.combinedAudio.blob, filename)

    setTimeout(() => {
      setDownloadStarted(false)
    }, 1000)
  }

  const shareResult = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my song made with Producify!",
          text: `I just created a ${audioData?.genre || ""} song using AI-powered music production.`,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  const createAnother = () => {
    clearAudioStore()
    router.push("/create")
  }

  if (!audioData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  const genreCapitalized = audioData.genre.charAt(0).toUpperCase() + audioData.genre.slice(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
            <Music className="h-6 w-6" />
            <span className="text-xl font-bold">Producify</span>
          </Link>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-green-500/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-green-500/20 rounded-full p-4">
                <Music className="h-10 w-10 text-green-400" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Song is Ready! 🎉</h1>
          <p className="text-gray-300">
            {audioData.parts.length} part{audioData.parts.length !== 1 ? "s" : ""} combined into a complete song
          </p>
        </div>

        {/* Main Player Card */}
        <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20 mb-8 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">My Producify Song</CardTitle>
                <CardDescription className="text-gray-300">
                  {audioData.parts.length} parts combined
                </CardDescription>
              </div>
              <Badge className="bg-purple-600 text-white">{genreCapitalized}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Audio Player */}
            {audioData.combinedAudio?.url && (
              <AudioPlayer
                audioUrl={audioData.combinedAudio.url}
                showWaveform={true}
                className="mb-6"
              />
            )}

            {/* Song Stats */}
            <div className="grid grid-cols-3 gap-4 text-center p-4 bg-black/20 rounded-lg">
              <div>
                <div className="text-gray-400 text-xs mb-1">Duration</div>
                <div className="text-white font-semibold">
                  {formatDuration(audioData.combinedAudio?.duration || 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Parts</div>
                <div className="text-white font-semibold">{audioData.parts.length}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs mb-1">Format</div>
                <div className="text-white font-semibold">WAV 16-bit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleDownload}
              disabled={downloadStarted || !audioData.combinedAudio?.blob}
              className="bg-green-600 hover:bg-green-700 h-12"
            >
              {downloadStarted ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download WAV
                </>
              )}
            </Button>

            <Button
              onClick={shareResult}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share Song
            </Button>

            <Button
              onClick={createAnother}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Create Another
            </Button>
          </div>
        </div>

        {/* Song Structure Details */}
        <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Song Structure</CardTitle>
              {showDetails ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </CardHeader>

          {showDetails && (
            <CardContent>
              {/* Arrangement Visualization */}
              <div className="mb-6">
                <div className="text-sm text-gray-400 mb-2">Song Order</div>
                <div className="flex gap-1 flex-wrap">
                  {audioData.parts.map((part, i) => (
                    <div
                      key={part.id}
                      className={`${getPartTypeColor(part.type)} text-white text-xs px-3 py-1 rounded-full font-medium`}
                    >
                      {part.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Individual Parts */}
              <div className="space-y-3">
                <div className="text-sm text-gray-400">Recorded Parts</div>

                <div className="grid gap-2">
                  {audioData.parts.map((part, index) => (
                    <div
                      key={part.id}
                      className={`flex items-center justify-between p-3 ${getPartTypeBgColor(part.type)} rounded-lg border ${getPartTypeBorderColor(part.type)}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm">#{index + 1}</span>
                        <div className={`w-2 h-2 ${getPartTypeColor(part.type)} rounded-full`} />
                        <span className="text-white">{part.label}</span>
                      </div>
                      <span className="text-gray-400 text-sm">
                        {formatDuration(part.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Tips */}
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <p className="text-gray-400 text-sm">
            💡 Tip: Try different arrangements by reordering your parts before combining!
          </p>
        </div>
      </div>
    </div>
  )
}
