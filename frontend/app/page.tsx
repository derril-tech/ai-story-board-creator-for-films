'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function Home() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    const allowedTypes = ['.pdf', '.fdx', '.fountain', '.txt']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      toast.error('Please upload a valid script file (PDF, FDX, Fountain, or TXT)')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/scripts/upload`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      toast.success('Script uploaded successfully!')
      
      // Redirect to script processing page
      // router.push(`/scripts/${result.script_id}`)
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload script. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/xml': ['.fdx'],
      'text/plain': ['.fountain', '.txt'],
    },
    multiple: false,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Storyboard Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your screenplay into a fully illustrated storyboard with AI-powered scene breakdowns, 
            camera angles, and visual frames.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Upload Your Script</h2>
              <p className="card-subtitle">
                Supported formats: PDF, Final Draft (FDX), Fountain, and plain text
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive 
                  ? 'border-primary-400 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                }
                ${isUploading ? 'pointer-events-none opacity-75' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Uploading script...</p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{uploadProgress}% complete</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <CloudArrowUpIcon className="w-16 h-16 mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isDragActive ? 'Drop your script here' : 'Drag & drop your script'}
                    </p>
                    <p className="text-gray-600">or click to browse files</p>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>PDF, FDX, Fountain, TXT</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Your script will be automatically parsed to extract scenes, dialogue, and action sequences.
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-semibold">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Upload Script</h3>
              <p className="text-sm text-gray-600">Upload your screenplay in any supported format</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-semibold">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">AI Analysis</h3>
              <p className="text-sm text-gray-600">AI automatically breaks down scenes and generates shot suggestions</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-primary-600 font-semibold">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Generate Storyboard</h3>
              <p className="text-sm text-gray-600">Create illustrated frames and export your complete storyboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
