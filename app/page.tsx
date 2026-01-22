import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Mic, Download, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Music className="h-8 w-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">musicPro</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your voice into professional songs with AI-powered beats, melody, and mastering
          </p>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-purple-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Mic className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Record Your Parts</h3>
                <p className="text-gray-300">Record verse, bridge/pre-chorus, and chorus separately</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Processing</h3>
                <p className="text-gray-300">Choose genre and let AI add beats, melody, and mastering</p>
              </div>
              <div className="text-center">
                <div className="bg-green-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Download className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Download Song</h3>
                <p className="text-gray-300">Get your professionally produced song ready to share</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Multiple Genres</CardTitle>
              <CardDescription className="text-gray-300">Pop, R&B, Afrobeat, Hip-Hop, Rock, and more</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Professional Quality</CardTitle>
              <CardDescription className="text-gray-300">
                AI-powered mastering and mixing for studio-quality sound
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Easy to Use</CardTitle>
              <CardDescription className="text-gray-300">
                Simple interface - just record, choose genre, and download
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/create">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg">
              Start Creating Your Song
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
