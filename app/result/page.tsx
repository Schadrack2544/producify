"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Play, Pause, Share2, Music, Home } from "lucide-react"
import Link from "next/link"

export default function ResultPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // In a real app, this would control audio playback
  }

  const downloadSong = () => {
    setDownloadStarted(true)
    // In a real app, this would trigger the actual download
    // For demo purposes, we'll simulate a download
    setTimeout(() => {
      setDownloadStarted(false)
      // Create a dummy download link
      const link = document.createElement("a")
      link.href = "#"
      link.download = "my-producify-song.mp3"
      link.click()
    }, 2000)
  }

  const shareResult = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out my song made with Producify!",
          text: "I just created an amazing song using AI-powered music production.",
          url: window.location.href,
        })
      } catch (error) {
        console.log("Error sharing:", error)
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-purple-300">
            <Music className="h-6 w-6" />
            <span className="text-xl font-bold">Producify</span>
          </Link>
        </div>

        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="bg-green-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Music className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Your Song is Ready! 🎉</h1>
          <p className="text-gray-300">AI has transformed your recordings into a professional song</p>
        </div>

        {/* Song Player Card */}
        <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white">My Producify Song</CardTitle>
                <CardDescription className="text-gray-300">Created with AI-powered production</CardDescription>
              </div>
              <Badge className="bg-purple-600 text-white">Pop Style</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Waveform Visualization (Placeholder) */}
            <div className="bg-black/30 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center h-24">
                <div className="flex items-end gap-1 h-full">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <div
                      key={i}
                      className={`bg-purple-400 w-1 transition-all duration-300 ${isPlaying ? "animate-pulse" : ""}`}
                      style={{
                        height: `${Math.random() * 100}%`,
                        minHeight: "10%",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                onClick={togglePlay}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 rounded-full w-16 h-16"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>
            </div>

            {/* Song Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Duration</div>
                <div className="text-white font-semibold">3:24</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Quality</div>
                <div className="text-white font-semibold">320kbps</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button onClick={downloadSong} disabled={downloadStarted} className="bg-green-600 hover:bg-green-700 h-12">
              {downloadStarted ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download MP3
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
            <Link href="/">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Create Another
              </Button>
            </Link>
          </div>

          {/* Production Details */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Production Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">AI Processing</div>
                  <div className="text-white">✓ Beat Generation</div>
                  <div className="text-white">✓ Melody Addition</div>
                  <div className="text-white">✓ Vocal Enhancement</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Mastering</div>
                  <div className="text-white">✓ EQ Balancing</div>
                  <div className="text-white">✓ Compression</div>
                  <div className="text-white">✓ Stereo Enhancement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
