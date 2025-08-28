'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  ClockIcon, 
  PlayIcon, 
  SpeakerWaveIcon,
  MusicalNoteIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Dialogue {
  id: string
  character: string
  line: string
  time_start?: number
  time_end?: number
  estimated_duration?: number
  order_index: number
}

interface TimingAnalysis {
  total_dialogue_lines: number
  total_duration: number
  average_line_duration: number
  pacing_score: number
  suggestions: string[]
}

export default function DialogueTimingPage() {
  const params = useParams()
  const sceneId = params.id as string
  
  const [dialogues, setDialogues] = useState<Dialogue[]>([])
  const [analysis, setAnalysis] = useState<TimingAnalysis | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [speakingRate, setSpeakingRate] = useState(2.5)
  const [pauseDuration, setPauseDuration] = useState(0.5)

  useEffect(() => {
    loadDialogues()
    loadAnalysis()
  }, [sceneId])

  const loadDialogues = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/dialogues?scene_id=${sceneId}`)
      if (response.ok) {
        const data = await response.json()
        setDialogues(data.dialogues || [])
      }
    } catch (error) {
      console.error('Error loading dialogues:', error)
      toast.error('Failed to load dialogues')
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalysis = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/dialogues/${sceneId}/timing-analysis`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      }
    } catch (error) {
      console.error('Error loading analysis:', error)
    }
  }

  const estimateTiming = async () => {
    setIsEstimating(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/dialogues/${sceneId}/estimate-timing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          speaking_rate: speakingRate,
          pause_duration: pauseDuration,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setDialogues(data.timings)
        toast.success('Timing estimated successfully!')
        loadAnalysis() // Refresh analysis
      } else {
        throw new Error('Failed to estimate timing')
      }
    } catch (error) {
      console.error('Error estimating timing:', error)
      toast.error('Failed to estimate timing')
    } finally {
      setIsEstimating(false)
    }
  }

  const generateTTS = async () => {
    setIsGeneratingTTS(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/dialogues/${sceneId}/generate-tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_id: 'default',
          speaking_rate: speakingRate,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('TTS audio generated successfully!')
      } else {
        throw new Error('Failed to generate TTS')
      }
    } catch (error) {
      console.error('Error generating TTS:', error)
      toast.error('Failed to generate TTS')
    } finally {
      setIsGeneratingTTS(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dialogue Timing</h1>
        <p className="text-gray-600">Manage dialogue timing and synchronization</p>
      </div>

      {/* Timing Controls */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">Timing Controls</h2>
          <p className="card-subtitle">Configure timing parameters and generate estimates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speaking Rate (words per second)
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={speakingRate}
              onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Slow (1.0)</span>
              <span>{speakingRate}</span>
              <span>Fast (5.0)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pause Duration (seconds)
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={pauseDuration}
              onChange={(e) => setPauseDuration(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>No pause (0s)</span>
              <span>{pauseDuration}s</span>
              <span>Long pause (2s)</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={estimateTiming}
            disabled={isEstimating}
            className="btn-primary flex items-center space-x-2"
          >
            {isEstimating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Estimating...</span>
              </>
            ) : (
              <>
                <ClockIcon className="w-4 h-4" />
                <span>Estimate Timing</span>
              </>
            )}
          </button>

          <button
            onClick={generateTTS}
            disabled={isGeneratingTTS}
            className="btn-secondary flex items-center space-x-2"
          >
            {isGeneratingTTS ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <SpeakerWaveIcon className="w-4 h-4" />
                <span>Generate TTS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timing Analysis */}
      {analysis && (
        <div className="card mb-8">
          <div className="card-header">
            <h2 className="card-title flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2" />
              Timing Analysis
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{analysis.total_dialogue_lines}</div>
              <div className="text-sm text-gray-600">Total Lines</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{formatTime(analysis.total_duration)}</div>
              <div className="text-sm text-gray-600">Total Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{analysis.average_line_duration.toFixed(1)}s</div>
              <div className="text-sm text-gray-600">Avg Line Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{(analysis.pacing_score * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Pacing Score</div>
            </div>
          </div>

          {analysis.suggestions.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Suggestions:</h3>
              <ul className="space-y-1">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-primary-500 mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Dialogues List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Dialogues ({dialogues.length})</h2>
          <p className="card-subtitle">Dialogue lines with timing information</p>
        </div>

        {dialogues.length === 0 ? (
          <div className="text-center py-12">
            <SpeakerWaveIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dialogues yet</h3>
            <p className="text-gray-600 mb-4">Upload a script to extract dialogue lines</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dialogues.map((dialogue) => (
              <div key={dialogue.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Line {dialogue.order_index}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {dialogue.character}
                      </span>
                      {dialogue.time_start !== undefined && dialogue.time_end !== undefined && (
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {formatTime(dialogue.time_start)} - {formatTime(dialogue.time_end)}
                          {dialogue.estimated_duration && (
                            <span className="ml-2">({dialogue.estimated_duration.toFixed(1)}s)</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-900">{dialogue.line}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
