import { useState } from 'react'

function App() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [generateError, setGenerateError] = useState(null)
  
  // Video upload states
  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [videoData, setVideoData] = useState(null)
  const [uploadError, setUploadError] = useState(null)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!url) return
    
    setIsAnalyzing(true)
    setError(null)
    setResults(null)
    
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to analyze URL. Please try again.')
      }
      
      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your connection and try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateContent = async () => {
    if (!results) return
    
    setIsGenerating(true)
    setGenerateError(null)
    setGeneratedContent(null)
    
    try {
      const response = await fetch('http://localhost:8000/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Create engaging content based on these trends: ${results.trends.join(', ')}. Keywords: ${results.keywords.join(', ')}. Sentiment: ${results.sentiment}`,
          content_type: 'social_media',
          tone: results.sentiment === 'positive' ? 'enthusiastic' : 'professional',
          length: 500
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate content. Please try again.')
      }
      
      const data = await response.json()
      
      // Parse the generated content into structured format
      const content = data.content
      setGeneratedContent({
        caption: extractSection(content, 'Caption') || 'Engaging caption based on trending content!',
        hashtags: extractHashtags(content) || ['#TrendingNow', '#ViralContent', '#ContentCreation'],
        script: extractScenes(content) || [
          'Scene 1: Hook - Grab attention with trending topic',
          'Scene 2: Value - Deliver key insights and information',
          'Scene 3: CTA - Encourage engagement and action'
        ],
        musicStyle: extractSection(content, 'Music') || 'Upbeat and energetic background music',
        fullContent: content,
        wordCount: data.word_count
      })
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate content. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Helper functions to parse generated content
  const extractSection = (content, sectionName) => {
    const regex = new RegExp(`${sectionName}[:\\s]+([^\\n]+)`, 'i')
    const match = content.match(regex)
    return match ? match[1].trim() : null
  }
  
  const extractHashtags = (content) => {
    const hashtagRegex = /#\w+/g
    const matches = content.match(hashtagRegex)
    return matches ? matches.slice(0, 8) : null
  }
  
  const extractScenes = (content) => {
    const sceneRegex = /Scene \d+[:\s]+([^\n]+)/gi
    const matches = [...content.matchAll(sceneRegex)]
    return matches.length > 0 ? matches.map(m => m[0]) : null
  }

  const handleVideoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Validate file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid video file (MP4, MOV, AVI, MKV)')
      return
    }
    
    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Video file is too large. Maximum size is 100MB.')
      return
    }
    
    setVideoFile(file)
    setUploadError(null)
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setVideoPreview(previewUrl)
  }

  const handleVideoUpload = async () => {
    if (!videoFile) return
    
    setIsUploading(true)
    setUploadError(null)
    setVideoData(null)
    
    try {
      // Convert video file to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
          const base64String = reader.result.split(',')[1]
          resolve(base64String)
        }
        reader.onerror = reject
        reader.readAsDataURL(videoFile)
      })
      
      // Send as JSON with base64 encoded video
      const response = await fetch('http://localhost:8000/upload-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: videoFile.name,
          video_data: base64Data,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to upload video. Please try again.')
      }
      
      const data = await response.json()
      setVideoData(data)
      
      // Clear URL analysis results when video is uploaded
      setResults(null)
      setGeneratedContent(null)
    } catch (err) {
      setUploadError(err.message || 'Failed to upload video. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const clearVideo = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setVideoData(null)
    setUploadError(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-cyan-600/20 pointer-events-none"></div>
      
      <div className="relative">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                TrendCraft AI
              </span>
            </div>
            <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium">
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-40">
          <div className="max-w-5xl mx-auto text-center">
            {/* Glass backdrop container for hero content */}
            <div className="bg-gray-900/40 backdrop-blur-md rounded-3xl p-12 border border-gray-700/30 shadow-2xl">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-10">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
                <span className="text-purple-300 text-sm font-medium">AI-Powered Content Creation</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl font-bold mb-8 leading-tight text-center">
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  Your Trends.
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Your Face. Your Way.
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-16 max-w-2xl mx-auto leading-relaxed text-center">
                Transform trending content into personalized videos with AI. Analyze trends, generate scripts, and create engaging content in minutes.
              </p>

              {/* URL Input Form */}
              <form onSubmit={handleAnalyze} className="max-w-3xl mx-auto mb-6">
                <div className="flex flex-col sm:flex-row gap-4 p-3 bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-2xl">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste a trending URL to analyze..."
                    className="flex-1 px-8 py-6 bg-transparent text-white placeholder-gray-400 focus:outline-none text-lg"
                    required
                    disabled={isAnalyzing}
                  />
                  <button
                    type="submit"
                    disabled={isAnalyzing}
                    className="px-10 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-lg"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Analyzing...</span>
                      </span>
                    ) : (
                      'Analyze Trend'
                    )}
                  </button>
                </div>
              </form>

              {/* OR Divider */}
              <div className="max-w-3xl mx-auto mb-6 flex items-center">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="px-4 text-gray-400 text-sm font-medium">OR</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>

              {/* Video Upload Section */}
              <div className="max-w-3xl mx-auto mb-10">
                {!videoFile ? (
                  <div className="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center hover:border-purple-500 transition-colors">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white mb-2">Upload a Video</h3>
                    <p className="text-gray-400 mb-4">Get AI-powered shot list and frame analysis</p>
                    <label className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl font-medium cursor-pointer transition-all duration-200">
                      Choose Video File
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">MP4, MOV, AVI, MKV (Max 100MB)</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Video Preview */}
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <div>
                            <p className="text-white font-medium">{videoFile.name}</p>
                            <p className="text-sm text-gray-400">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={clearVideo}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {videoPreview && (
                        <video
                          src={videoPreview}
                          controls
                          className="w-full rounded-lg max-h-64 bg-black"
                        />
                      )}
                    </div>

                    {/* Upload Button */}
                    {!videoData && (
                      <button
                        onClick={handleVideoUpload}
                        disabled={isUploading}
                        className="w-full px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                      >
                        {isUploading ? (
                          <span className="flex items-center justify-center space-x-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Analyzing Video...</span>
                          </span>
                        ) : (
                          'Analyze Video & Generate Shot List'
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Upload Error Message */}
              {uploadError && (
                <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center space-x-2 text-red-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {/* Video Analysis Results */}
              {videoData && (
                <div className="max-w-3xl mx-auto mb-8 space-y-6">
                  {/* Success Header */}
                  <div className="flex items-center justify-center space-x-2 text-green-400 mb-6">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold">Video Analysis Complete!</span>
                  </div>

                  {/* Video Metadata */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-2">Video Information:</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-purple-400">{videoData.duration.toFixed(1)}s</p>
                        <p className="text-xs text-gray-400">Duration</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-cyan-400">{videoData.size_mb} MB</p>
                        <p className="text-xs text-gray-400">File Size</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-pink-400">{videoData.platform}</p>
                        <p className="text-xs text-gray-400">Platform</p>
                      </div>
                    </div>
                  </div>

                  {/* Extracted Frames */}
                  {videoData.frames && videoData.frames.length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                      <p className="text-sm text-gray-400 mb-3">Extracted Key Frames:</p>
                      <div className="grid grid-cols-5 gap-2">
                        {videoData.frames.map((frame, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={`http://localhost:8000${frame}`}
                              alt={`Frame ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-600 group-hover:border-purple-500 transition-colors"
                            />
                            <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                              {index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Shot List */}
                  {videoData.shot_list && videoData.shot_list.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl p-6">
                      <div className="flex items-center space-x-2 mb-4">
                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <h3 className="text-xl font-bold text-white">Detailed Shot List</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {videoData.shot_list.map((shot, index) => (
                          <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {shot.shot_number}
                                </span>
                                <div>
                                  <h4 className="text-white font-semibold">{shot.type}</h4>
                                  <p className="text-xs text-gray-400">{shot.timestamp}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-purple-400 font-medium">📸 Instruction: </span>
                                <span className="text-gray-300">{shot.instruction}</span>
                              </div>
                              <div>
                                <span className="text-cyan-400 font-medium">📐 Camera: </span>
                                <span className="text-gray-300">{shot.camera_angle}</span>
                              </div>
                              <div>
                                <span className="text-pink-400 font-medium">💡 Lighting: </span>
                                <span className="text-gray-300">{shot.lighting}</span>
                              </div>
                              <div>
                                <span className="text-yellow-400 font-medium">🎬 Action: </span>
                                <span className="text-gray-300">{shot.action}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center space-x-2 text-red-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Results Display */}
              {results && (
                <div className="max-w-3xl mx-auto mb-8 space-y-6">
                  {/* Success Header */}
                  <div className="flex items-center justify-center space-x-2 text-green-400 mb-6">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold">Analysis Complete!</span>
                  </div>

                  {/* Analyzed URL */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-1">Analyzed URL:</p>
                    <p className="text-white break-all">{results.url}</p>
                  </div>

                  {/* Sentiment */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-2">Sentiment:</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      results.sentiment === 'positive' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      results.sentiment === 'negative' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {results.sentiment.charAt(0).toUpperCase() + results.sentiment.slice(1)}
                    </span>
                  </div>

                  {/* Trends */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-3">Trends Detected:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.trends.map((trend, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-sm"
                        >
                          {trend}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                    <p className="text-sm text-gray-400 mb-3">Keywords:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Generate Content Button */}
                  <button
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    className="w-full px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-cyan-500/50 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Generating Content...</span>
                      </span>
                    ) : (
                      'Generate Content from Analysis'
                    )}
                  </button>
                </div>
              )}

              {/* Generate Error Message */}
              {generateError && (
                <div className="max-w-3xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center space-x-2 text-red-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{generateError}</span>
                  </div>
                </div>
              )}

              {/* Generated Content Display */}
              {generatedContent && (
                <div className="max-w-3xl mx-auto mb-8 space-y-6">
                  {/* Success Header */}
                  <div className="flex items-center justify-center space-x-2 text-cyan-400 mb-6">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-lg font-semibold">Content Generated Successfully!</span>
                  </div>

                  {/* Caption */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Caption for Instagram/TikTok</h3>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{generatedContent.caption}</p>
                  </div>

                  {/* Hashtags */}
                  <div className="bg-gradient-to-br from-pink-500/10 to-cyan-500/10 border border-pink-500/30 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Suggested Hashtags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.hashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-full text-sm font-medium"
                        >
                          {hashtag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Content Script */}
                  <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Content Script (3 Scenes)</h3>
                    </div>
                    <div className="space-y-3">
                      {generatedContent.script.map((scene, index) => (
                        <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                          <p className="text-gray-300">{scene}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Music Style */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                      <h3 className="text-lg font-semibold text-white">Recommended Music Style</h3>
                    </div>
                    <p className="text-gray-300">{generatedContent.musicStyle}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedContent.fullContent)
                        alert('Content copied to clipboard!')
                      }}
                      className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200"
                    >
                      Copy All Content
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedContent(null)
                        setResults(null)
                        setUrl('')
                      }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200"
                    >
                      Start New Analysis
                    </button>
                  </div>
                </div>
              )}

              {/* Trust indicators */}
              <div className="flex items-center justify-center space-x-8 text-gray-400 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free trial available</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-6 mt-32">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                How It Works
              </h2>
              <p className="text-xl text-gray-400">
                Create viral content in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/50">
                    <span className="text-3xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Analyze Trends</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Paste any trending URL and our AI instantly analyzes the content, extracting key insights, themes, and viral elements.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-cyan-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:border-pink-500/50 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/50">
                    <span className="text-3xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Generate Content</h3>
                  <p className="text-gray-400 leading-relaxed">
                    AI creates personalized scripts and content ideas tailored to your style, audience, and the trending topic.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <div className="relative bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:border-cyan-500/50 transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/50">
                    <span className="text-3xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">Create & Share</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Transform your content into engaging videos with your face and voice, ready to share across all platforms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 mt-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Lightning Fast</h3>
                <p className="text-gray-400">Generate content in seconds, not hours. Stay ahead of trends.</p>
              </div>

              <div className="bg-gradient-to-br from-pink-500/10 to-cyan-500/10 border border-purple-500/30 rounded-2xl p-8">
                <div className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Fully Customizable</h3>
                <p className="text-gray-400">Adjust tone, style, and format to match your brand perfectly.</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-purple-500/30 rounded-2xl p-8">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">AI-Powered</h3>
                <p className="text-gray-400">Advanced AI ensures high-quality, engaging content every time.</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-2xl p-8">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Analytics Included</h3>
                <p className="text-gray-400">Track performance and optimize your content strategy with insights.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 mt-32">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-20"></div>
              <div className="relative bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-3xl p-12 text-center backdrop-blur-sm">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Ready to Go Viral?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of creators using TrendCraft AI to create engaging content that resonates with their audience.
                </p>
                <button className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-semibold rounded-xl transition-all duration-200 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105">
                  Start Creating Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-6 py-16 border-t border-gray-800 mt-32">
          <div className="text-center text-gray-400">
            <p>&copy; 2026 TrendCraft AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App

// Made with Bob
