"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Mic, Square, Play, ArrowRight, Music, Sparkles, ArrowLeft,
  Trash2, Check, Plus, ArrowUp, ArrowDown
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { WaveformVisualizer } from "@/components/WaveformVisualizer"
import { RecordingTimer } from "@/components/RecordingTimer"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import {
  formatDuration
} from "@/lib/audioUtils"
import {
  setGenre,
  addPart,
  removePart,
  updatePartRecording,
  reorderParts,
  setTempo,
  getAudioStore,
  getPartTypeColor,
  getPartTypeBorderColor,
  getPartTypeBgColor,
  PartType,
  SongPart,
} from "@/lib/useAudioStore"
import { getDefaultBpm } from "@/lib/beatGenerator"

type RecordingState = "idle" | "recording" | "recorded"

const genres = ["Pop", "R&B", "Afrobeat", "Hip-Hop", "Rock", "Jazz", "Country", "Electronic", "Reggae", "Folk"]

const partTypes: { id: PartType; name: string; description: string }[] = [
  { id: "intro", name: "Intro", description: "Opening section of your song" },
  { id: "verse", name: "Verse", description: "Main story/content of your song" },
  { id: "bridge", name: "Bridge/Pre-Chorus", description: "Transition section that builds energy" },
  { id: "chorus", name: "Chorus", description: "Catchy, memorable hook of your song" },
  { id: "outro", name: "Outro", description: "Closing section of your song" },
]

export default function CreatePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedGenre, setSelectedGenre] = useState("")
  const [parts, setParts] = useState<SongPart[]>([])
  const [recordingStates, setRecordingStates] = useState<Record<string, RecordingState>>({})
  const [currentRecordingPartId, setCurrentRecordingPartId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [playingPartId, setPlayingPartId] = useState<string | null>(null)
  const [selectedPartType, setSelectedPartType] = useState<PartType>("verse")
  const [tempo, setTempoState] = useState(120)

  const {
    isRecording,
    recordingTime,
    audioLevel,
    startRecording: startRecorder,
    stopRecording: stopRecorder,
    error: recorderError,
  } = useAudioRecorder()

  // Sync with store
  useEffect(() => {
    const store = getAudioStore()
    setParts(store.parts)
    setTempoState(store.tempo)

    // Initialize recording states
    const states: Record<string, RecordingState> = {}
    store.parts.forEach(p => {
      states[p.id] = p.blob ? "recorded" : "idle"
    })
    setRecordingStates(states)
  }, [])

  // Update tempo in store when it changes
  const handleTempoChange = (newTempo: number) => {
    setTempoState(newTempo)
    setTempo(newTempo)
  }

  // Set default tempo based on genre when genre changes
  useEffect(() => {
    if (selectedGenre) {
      const defaultBpm = getDefaultBpm(selectedGenre)
      handleTempoChange(defaultBpm)
    }
  }, [selectedGenre])

  // Handle recording errors
  useEffect(() => {
    if (recorderError) {
      alert(recorderError)
    }
  }, [recorderError])

  const handleAddPart = () => {
    const newPart = addPart(selectedPartType)
    setParts(prev => [...prev, newPart])
    setRecordingStates(prev => ({ ...prev, [newPart.id]: "idle" }))
  }

  const handleRemovePart = (partId: string) => {
    removePart(partId)
    setParts(prev => prev.filter(p => p.id !== partId))
    setRecordingStates(prev => {
      const newStates = { ...prev }
      delete newStates[partId]
      return newStates
    })
  }

  const handleMovePart = (partId: string, direction: "up" | "down") => {
    const currentIndex = parts.findIndex(p => p.id === partId)
    if (currentIndex === -1) return

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= parts.length) return

    reorderParts(partId, newIndex)

    const newParts = [...parts]
    const [part] = newParts.splice(currentIndex, 1)
    newParts.splice(newIndex, 0, part)
    setParts(newParts.map((p, i) => ({ ...p, order: i })))
  }

  const startRecording = async (partId: string) => {
    // Clear any previous recording for this part
    const part = parts.find(p => p.id === partId)
    if (part?.url) {
      URL.revokeObjectURL(part.url)
    }

    setCurrentRecordingPartId(partId)
    setRecordingStates((prev) => ({ ...prev, [partId]: "recording" }))

    // Start recording WITHOUT a backing track - user records clean vocals first
    await startRecorder({
      backingTrackUrl: undefined,
      backingTrackVolume: 0,
      loopBackingTrack: false
    })
  }

  const stopRecording = async () => {
    if (!currentRecordingPartId) return

    const result = await stopRecorder()

    if (result) {
      const { blob, url, duration } = result

      // Update local state
      setParts(prev => prev.map(p =>
        p.id === currentRecordingPartId
          ? { ...p, blob, url, duration }
          : p
      ))
      setRecordingStates((prev) => ({ ...prev, [currentRecordingPartId]: "recorded" }))

      // Store in global store
      updatePartRecording(currentRecordingPartId, { blob, url, duration })
    }

    setCurrentRecordingPartId(null)
  }

  const playRecording = (partId: string) => {
    const part = parts.find(p => p.id === partId)
    if (!part?.url) return

    const audio = new Audio(part.url)

    audio.onplay = () => setPlayingPartId(partId)
    audio.onended = () => setPlayingPartId(null)
    audio.onpause = () => setPlayingPartId(null)

    audio.play()
  }

  const canProceed = () => {
    return selectedGenre && parts.length > 0 && parts.every(p => p.blob !== null)
  }

  const processAudio = async () => {
    if (!canProceed()) return

    setIsProcessing(true)

    try {
      // Mark recording phase as complete
      setGenre(selectedGenre)
      setTempo(tempo)

      // Navigate to analysis page where beats will be generated while audio is being combined
      router.push("/analysis")

    } catch (error) {
      console.error("Error starting analysis:", error)
      alert("There was an error starting the analysis. Please try again.")
      setIsProcessing(false)
    }
  }

  const progress = ((currentStep + 1) / 3) * 100

  const totalDuration = parts.reduce((acc, p) => acc + p.duration, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
            <Music className="h-6 w-6" />
            <span className="text-xl font-bold">musicPro</span>
          </Link>

          {currentStep > 0 && !isProcessing && (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        {/* Progress */}
        {!isProcessing && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Step {currentStep + 1} of 3</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Step 1: Genre Selection */}
        {currentStep === 0 && (
          <Card className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Choose Your Genre
              </CardTitle>
              <CardDescription className="text-gray-300">
                Select the music genre that best fits your song vision
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
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
                <div className="mt-6 p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <p className="text-purple-200 text-sm">
                    <span className="font-semibold">Great choice!</span> Your song will be arranged in a {selectedGenre} style.
                  </p>
                </div>
              )}

              {selectedGenre && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setCurrentStep(1)} className="bg-purple-600 hover:bg-purple-700">
                    Next: Build Your Song <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Recording */}
        {currentStep === 1 && !isProcessing && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Build Your Song</h2>
              <p className="text-gray-300 mb-4">Add and record song parts in any order you want</p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Badge className="bg-purple-600 text-white">
                  Genre: {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}
                </Badge>
                {parts.length > 0 && (
                  <Badge variant="outline" className="border-white/30 text-white">
                    {parts.length} part{parts.length !== 1 ? "s" : ""}
                  </Badge>
                )}
                {totalDuration > 0 && (
                  <Badge variant="outline" className="border-green-400 text-green-400">
                    Total: {formatDuration(totalDuration)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Add Part Section */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
              <CardHeader>
                <CardTitle className="text-white text-lg">Add Song Parts</CardTitle>
                <CardDescription className="text-gray-300">
                  Add as many verses, choruses, or other parts as you need
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap items-center">
                  <Select value={selectedPartType} onValueChange={(v) => setSelectedPartType(v as PartType)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {partTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddPart} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add {partTypes.find(t => t.id === selectedPartType)?.name}
                  </Button>
                </div>

                {/* Quick add buttons */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  <span className="text-gray-400 text-sm">Quick add:</span>
                  {partTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newPart = addPart(type.id)
                        setParts(prev => [...prev, newPart])
                        setRecordingStates(prev => ({ ...prev, [newPart.id]: "idle" }))
                      }}
                      className={`${getPartTypeBgColor(type.id)} ${getPartTypeBorderColor(type.id)} text-white hover:opacity-80 border`}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {type.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Song Parts List */}
            {parts.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 border-dashed">
                <CardContent className="py-12 text-center">
                  <Music className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No song parts added yet</p>
                  <p className="text-gray-500 text-sm">Add your first verse or chorus to get started</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {parts.map((part, index) => (
                  <Card key={part.id} className="bg-white/10 backdrop-blur-sm border-white/20 overflow-hidden">
                    <div className={`h-1 ${getPartTypeColor(part.type)}`} />
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={index === 0 || isRecording}
                              onClick={() => handleMovePart(part.id, "up")}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={index === parts.length - 1 || isRecording}
                              onClick={() => handleMovePart(part.id, "down")}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <div>
                            <CardTitle className="text-white flex items-center gap-2 text-base">
                              <span className="text-gray-400 text-sm font-normal">#{index + 1}</span>
                              {part.label}
                              {recordingStates[part.id] === "recorded" && (
                                <Check className="h-4 w-4 text-green-400" />
                              )}
                            </CardTitle>
                            <CardDescription className="text-gray-400 text-xs">
                              {partTypes.find(t => t.id === part.type)?.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {part.duration > 0 && (
                            <Badge variant="outline" className="border-gray-400 text-gray-300">
                              {formatDuration(part.duration)}
                            </Badge>
                          )}
                          <Badge
                            variant={recordingStates[part.id] === "recorded" ? "default" : "secondary"}
                            className={recordingStates[part.id] === "recorded" ? "bg-green-600" : ""}
                          >
                            {recordingStates[part.id] === "recorded"
                              ? "Recorded"
                              : recordingStates[part.id] === "recording"
                                ? "Recording..."
                                : "Not Recorded"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Waveform Visualizer */}
                      {(currentRecordingPartId === part.id || part.url) && (
                        <WaveformVisualizer
                          audioLevel={currentRecordingPartId === part.id ? audioLevel : 0}
                          audioUrl={part.url || undefined}
                          isRecording={currentRecordingPartId === part.id && isRecording}
                          isPlaying={playingPartId === part.id}
                          height={50}
                          barCount={35}
                          className="mb-3"
                        />
                      )}

                      {/* Recording Timer */}
                      {currentRecordingPartId === part.id && isRecording && (
                        <div className="flex justify-center mb-3">
                          <RecordingTimer time={recordingTime} isRecording={true} />
                        </div>
                      )}

                      <div className="flex items-center gap-3 flex-wrap">
                        {recordingStates[part.id] === "idle" && (
                          <Button
                            onClick={() => startRecording(part.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isRecording && currentRecordingPartId !== part.id}
                          >
                            <Mic className="mr-2 h-4 w-4" />
                            Record
                          </Button>
                        )}

                        {recordingStates[part.id] === "recording" && currentRecordingPartId === part.id && (
                          <Button onClick={stopRecording} className="bg-red-600 hover:bg-red-700 animate-pulse">
                            <Square className="mr-2 h-4 w-4" />
                            Stop
                          </Button>
                        )}

                        {recordingStates[part.id] === "recorded" && (
                          <>
                            <Button
                              onClick={() => playRecording(part.id)}
                              variant="outline"
                              size="sm"
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                              disabled={playingPartId !== null}
                            >
                              <Play className="mr-2 h-3 w-3" />
                              {playingPartId === part.id ? "Playing..." : "Play"}
                            </Button>
                            <Button
                              onClick={() => startRecording(part.id)}
                              variant="outline"
                              size="sm"
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                              disabled={isRecording}
                            >
                              <Mic className="mr-2 h-3 w-3" />
                              Re-record
                            </Button>
                          </>
                        )}

                        <Button
                          onClick={() => handleRemovePart(part.id)}
                          variant="outline"
                          size="sm"
                          className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 ml-auto"
                          disabled={isRecording}
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Song Preview */}
            {parts.length > 0 && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">Song Structure Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-1 flex-wrap">
                    {parts.map((part, i) => (
                      <div
                        key={part.id}
                        className={`${getPartTypeColor(part.type)} text-white text-xs px-2 py-1 rounded font-medium ${!part.blob ? "opacity-50" : ""
                          }`}
                      >
                        {part.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {canProceed() && (
              <div className="text-center mt-8">
                <Button
                  onClick={processAudio}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create My Song
                </Button>
              </div>
            )}

            {parts.length > 0 && !canProceed() && (
              <div className="text-center mt-6">
                <p className="text-yellow-400 text-sm">
                  Record all parts to continue ({parts.filter(p => p.blob).length}/{parts.length} recorded)
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
