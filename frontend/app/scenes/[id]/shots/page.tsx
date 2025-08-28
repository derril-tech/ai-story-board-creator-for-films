'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  CameraIcon, 
  ClockIcon, 
  PlayIcon, 
  PlusIcon,
  TrashIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Shot {
  id: string
  order_index: number
  description: string
  camera_metadata: {
    size: string
    angle: string
    movement?: string
    lens?: string
    notes?: string
  }
  estimated_duration?: number
  characters: string[]
}

interface ShotTemplate {
  id: string
  name: string
  description: string
  characteristics: string[]
}

export default function ShotPlanningPage() {
  const params = useParams()
  const sceneId = params.id as string
  
  const [shots, setShots] = useState<Shot[]>([])
  const [templates, setTemplates] = useState<ShotTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('dialogue-heavy')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadShots()
    loadTemplates()
  }, [sceneId])

  const loadShots = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/shots?scene_id=${sceneId}`)
      if (response.ok) {
        const data = await response.json()
        setShots(data.shots || [])
      }
    } catch (error) {
      console.error('Error loading shots:', error)
      toast.error('Failed to load shots')
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/shots/templates`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const generateShots = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/shots/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scene_id: sceneId,
          template: selectedTemplate,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setShots(data.shots)
        toast.success('Shots generated successfully!')
      } else {
        throw new Error('Failed to generate shots')
      }
    } catch (error) {
      console.error('Error generating shots:', error)
      toast.error('Failed to generate shots')
    } finally {
      setIsGenerating(false)
    }
  }

  const deleteShot = async (shotId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/shots/${shotId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShots(shots.filter(shot => shot.id !== shotId))
        toast.success('Shot deleted successfully')
      } else {
        throw new Error('Failed to delete shot')
      }
    } catch (error) {
      console.error('Error deleting shot:', error)
      toast.error('Failed to delete shot')
    }
  }

  const getShotSizeColor = (size: string) => {
    const colors = {
      'EXTREME_CLOSE_UP': 'bg-red-100 text-red-800',
      'CLOSE_UP': 'bg-orange-100 text-orange-800',
      'MEDIUM_CLOSE_UP': 'bg-yellow-100 text-yellow-800',
      'MEDIUM': 'bg-green-100 text-green-800',
      'MEDIUM_WIDE': 'bg-blue-100 text-blue-800',
      'WIDE': 'bg-indigo-100 text-indigo-800',
      'EXTREME_WIDE': 'bg-purple-100 text-purple-800',
    }
    return colors[size as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shot Planning</h1>
        <p className="text-gray-600">Plan and organize camera shots for your scene</p>
      </div>

      {/* Template Selection */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="card-title">Shot Templates</h2>
          <p className="card-subtitle">Choose a template to automatically generate shot suggestions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate === template.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="space-y-1">
                {template.characteristics.map((char, index) => (
                  <div key={index} className="text-xs text-gray-500">• {char}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={generateShots}
          disabled={isGenerating}
          className="btn-primary flex items-center space-x-2"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" />
              <span>Generate Shots</span>
            </>
          )}
        </button>
      </div>

      {/* Shots List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Shots ({shots.length})</h2>
          <p className="card-subtitle">Camera shots for this scene</p>
        </div>

        {shots.length === 0 ? (
          <div className="text-center py-12">
            <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shots yet</h3>
            <p className="text-gray-600 mb-4">Generate shots using a template to get started</p>
            <button
              onClick={generateShots}
              disabled={isGenerating}
              className="btn-primary"
            >
              Generate Shots
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {shots.map((shot) => (
              <div key={shot.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Shot {shot.order_index}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getShotSizeColor(shot.camera_metadata.size)}`}>
                        {shot.camera_metadata.size.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {shot.camera_metadata.angle.replace('_', ' ')}
                      </span>
                      {shot.estimated_duration && (
                        <div className="flex items-center text-sm text-gray-500">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {shot.estimated_duration}s
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-gray-900 mb-2">{shot.description}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Camera:</span>
                        <div className="text-gray-600">
                          <div>Size: {shot.camera_metadata.size.replace('_', ' ')}</div>
                          <div>Angle: {shot.camera_metadata.angle.replace('_', ' ')}</div>
                          {shot.camera_metadata.movement && (
                            <div>Movement: {shot.camera_metadata.movement}</div>
                          )}
                          {shot.camera_metadata.lens && (
                            <div>Lens: {shot.camera_metadata.lens}</div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Characters:</span>
                        <div className="text-gray-600">
                          {shot.characters.length > 0 ? (
                            shot.characters.join(', ')
                          ) : (
                            'No characters specified'
                          )}
                        </div>
                        
                        {shot.camera_metadata.notes && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700">Notes:</span>
                            <div className="text-gray-600">{shot.camera_metadata.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => deleteShot(shot.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
