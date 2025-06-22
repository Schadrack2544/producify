"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Mic, Square, Play, ArrowRight, Music, Sparkles } from "lucide-react"
import Link from "next/link"

type SongPart = "verse" | "bridge" | "chorus"
type RecordingState = "idle" | "recording" | "recorded"

interface Recording {
  blob: Blob | null
  url: string | null
  duration: number
}

const genres = ["Pop", "R&B", "Afrobeat", "Hip-Hop", "Rock", "Jazz", "Country", "Electronic", "Reggae", "Folk"]

const songParts = [
  { id: "verse" as SongPart, name: "Verse", description: "Main story/content of your song" },
  { id: "bridge" as SongPart, name: "Bridge/Pre-Chorus", description: "Transition section that builds energy" },
  { id: "chorus" as SongPart, name: "Chorus", description: "Catchy, memorable hook of your song" },
]

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedGenre, setSelectedGenre] = useState("")
  const [recordings, setRecordings] = useState<Record<SongPart, Recording>>({
    verse: { blob: null, url: null, duration: 0 },
    bridge: { blob: null, url: null, duration: 0 },
    chorus: { blob: null, url: null, duration: 0 },
  })
  const [recordingStates, setRecordingStates] = useState<Record<SongPart, RecordingState>>({
    verse: "idle",
    bridge: "idle",
    chorus: "idle",
  })
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const startRecording = async (part: SongPart) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" })
        const url = URL.createObjectURL(blob)
        setRecordings((prev) => ({
          ...prev,
          [part]: { blob, url, duration: 0 },
        }))
        setRecordingStates((prev) => ({ ...prev, [part]: "recorded" }))
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setRecordingStates((prev) => ({ ...prev, [part]: "recording" }))
    } catch (error) {
      console.error("Error accessing microphone:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop()
      setMediaRecorder(null)
    }
  }

  const playRecording = (part: SongPart) => {
    if (recordings[part].url) {
      const audio = new Audio(recordings[part].url!)
      audio.play()
    }
  }

  const canProceed = () => {
    return selectedGenre && Object.values(recordings).every((r) => r.blob !== null)
  }

  const processAudio = async () => {
    if (!canProceed()) return

    setIsProcessing(true)
    // Here you would integrate with Fal AI or another audio processing service
    // For demo purposes, we'll simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      // Redirect to results page
      window.location.href = "/result"
    }, 5000)
  }

  const progress = ((currentStep + 1) / 4) * 100

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

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Step {currentStep + 1} of 4</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {currentStep === 0 && (
          <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Choose Your Genre</CardTitle>
              <CardDescription className="text-gray-300">
                Select the music genre that best fits your song vision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre.toLowerCase()}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedGenre && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setCurrentStep(1)} className="bg-purple-600 hover:bg-purple-700">
                    Next: Record Parts <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Record Your Song Parts</h2>
              <p className="text-gray-300">Record each section of your song separately</p>
              {selectedGenre && (
                <Badge className="mt-2 bg-purple-600 text-white">
                  Genre: {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}
                </Badge>
              )}
            </div>

            <div className="grid gap-6">
              {songParts.map((part) => (
                <Card key={part.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{part.name}</CardTitle>
                        <CardDescription className="text-gray-300">{part.description}</CardDescription>
                      </div>
                      <Badge variant={recordingStates[part.id] === "recorded" ? "default" : "secondary"}>
                        {recordingStates[part.id] === "recorded" ? "Recorded" : "Not Recorded"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {recordingStates[part.id] === "idle" && (
                        <Button onClick={() => startRecording(part.id)} className="bg-red-600 hover:bg-red-700">
                          <Mic className="mr-2 h-4 w-4" />
                          Start Recording
                        </Button>
                      )}
                      {recordingStates[part.id] === "recording" && (
                        <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 animate-pulse">
                          <Square className="mr-2 h-4 w-4" />
                          Stop Recording
                        </Button>
                      )}
                      {recordingStates[part.id] === "recorded" && (
                        <>
                          <Button
                            onClick={() => playRecording(part.id)}
                            variant="outline"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Play
                          </Button>
                          <Button
                            onClick={() => startRecording(part.id)}
                            variant="outline"
                            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                          >
                            <Mic className="mr-2 h-4 w-4" />
                            Re-record
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {canProceed() && (
              <div className="text-center mt-8">
                <Button onClick={() => setCurrentStep(2)} size="lg" className="bg-purple-600 hover:bg-purple-700">
                  Process My Song <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Ready to Process</CardTitle>
              <CardDescription className="text-gray-300">
                Your recordings will be combined with AI-generated beats and melody
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white">Genre:</span>
                  <Badge className="bg-purple-600 text-white">
                    {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <span className="text-white">Recorded Parts:</span>
                  <div className="flex gap-2">
                    {songParts.map((part) => (
                      <Badge key={part.id} variant="outline" className="border-green-400 text-green-400">
                        {part.name} ✓
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={processAudio}
                  disabled={isProcessing}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      Processing...{" "}
                      <div className="ml-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    </>
                  ) : (
                    <>
                      Start Processing <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isProcessing && (
          <Card className="max-w-2xl mx-auto mt-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Processing Your Song</h3>
                <p className="text-gray-300 mb-4">AI is adding beats, melody, and mastering your track...</p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>• Analyzing your vocal recordings</div>
                  <div>• Generating {selectedGenre} style beats</div>
                  <div>• Adding harmonies and melody</div>
                  <div>• Professional mastering and mixing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
