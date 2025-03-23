'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface TranscriptionResponse {
  content: string;
}

interface SummaryHighlight {
  moment: string;
  timestamp?: string;
}

interface MainPoint {
  point: string;
  description: string;
}

interface Reference {
  type: string;
  description: string;
}

interface VideoSummary {
  title: string;
  quickSummary: string;
  mainPoints: MainPoint[];
  highlights: SummaryHighlight[];
  keyConclusions: string;
  references: Reference[];
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState<string>('');
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  
  // Add states for API key management
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [supadataApiKey, setSupadataApiKey] = useState('');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [savedApiKeys, setSavedApiKeys] = useState(false);
  
  // Check for stored API keys on load
  useEffect(() => {
    const storedSupadataKey = localStorage.getItem('supadataApiKey');
    const storedDeepseekKey = localStorage.getItem('deepseekApiKey');
    
    if (storedSupadataKey) setSupadataApiKey(storedSupadataKey);
    if (storedDeepseekKey) setDeepseekApiKey(storedDeepseekKey);
    if (storedSupadataKey || storedDeepseekKey) setSavedApiKeys(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTranscript('');
    setSummary(null);

    try {
      console.log('Sending request with URL:', url);
      
      // Include API keys in the request if they exist
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (supadataApiKey) {
        headers['X-Supadata-Api-Key'] = supadataApiKey;
      }
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          url,
          customApiKey: supadataApiKey || undefined
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Server returned an invalid response. Please try again.');
      }
      
      console.log('Response received:', data);

      if (!response.ok) {
        const errorMessage = 
          data && typeof data === 'object' && 'error' in data
            ? data.error
            : data && typeof data === 'object' && 'message' in data
            ? data.message
            : 'Failed to transcribe video';
        
        // Show API key form for specific errors
        if (
          (typeof errorMessage === 'string' && (
            errorMessage.includes('API key') || 
            errorMessage.includes('API configuration') ||
            errorMessage.includes('401')
          )) ||
          response.status === 401
        ) {
          setShowApiKeyForm(true);
        }
        
        throw new Error(errorMessage);
      }

      if (!data.content) {
        throw new Error('No transcript content received');
      }

      setTranscript(data.content);

      // Generate summary
      setSummarizing(true);
      try {
        const summaryHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (deepseekApiKey) {
          summaryHeaders['X-Deepseek-Api-Key'] = deepseekApiKey;
        }
        
        const summaryResponse = await fetch('/api/summarize', {
          method: 'POST',
          headers: summaryHeaders,
          body: JSON.stringify({ 
            transcript: data.content,
            customApiKey: deepseekApiKey || undefined
          })
        });

        let summaryData;
        try {
          summaryData = await summaryResponse.json();
        } catch (jsonError) {
          console.error('Failed to parse summary JSON response:', jsonError);
          throw new Error('Server returned an invalid summary response. Please try again.');
        }

        if (!summaryResponse.ok) {
          const errorMessage = 
            summaryData && typeof summaryData === 'object' && 'error' in summaryData
              ? summaryData.error
              : summaryData && typeof summaryData === 'object' && 'message' in summaryData
              ? summaryData.message
              : 'Failed to generate summary';
          
          // Show API key form for specific errors
          if (
            (typeof errorMessage === 'string' && (
              errorMessage.includes('API key') || 
              errorMessage.includes('API configuration') ||
              errorMessage.includes('401')
            )) ||
            summaryResponse.status === 401
          ) {
            setShowApiKeyForm(true);
          }
          
          throw new Error(errorMessage);
        }

        try {
          const parsedSummary = JSON.parse(summaryData.summary);
          setSummary(parsedSummary);
        } catch (parseError) {
          console.error('Failed to parse summary content:', parseError, summaryData);
          throw new Error('Received invalid summary format. Please try again.');
        }
      } catch (err) {
        console.error('Summary error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary. You can still view the full transcript below.';
        setError(errorMessage);
      } finally {
        setSummarizing(false);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveApiKeys = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save API keys to localStorage
    if (supadataApiKey) localStorage.setItem('supadataApiKey', supadataApiKey);
    if (deepseekApiKey) localStorage.setItem('deepseekApiKey', deepseekApiKey);
    
    setSavedApiKeys(true);
    setShowApiKeyForm(false);
    
    // Show success message
    alert('API keys saved successfully! Please try transcribing your video again.');
  };
  
  const handleClearApiKeys = () => {
    localStorage.removeItem('supadataApiKey');
    localStorage.removeItem('deepseekApiKey');
    setSupadataApiKey('');
    setDeepseekApiKey('');
    setSavedApiKeys(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient">
              YouTube Transcriber
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Transform your YouTube videos into text with our advanced AI-powered transcription service
            </p>
          </div>

          {showApiKeyForm ? (
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 transition-all duration-300 hover:shadow-purple-500/10 mb-8 animate-fadeIn">
              <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                API Keys Required
              </h2>
              <p className="text-gray-300 mb-6">
                To use this application, you need to provide your own API keys. These will be stored locally in your browser.
              </p>
              
              <form onSubmit={handleSaveApiKeys} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="supadata-api-key" className="block text-lg font-medium text-gray-300">
                    SUPADATA API Key
                  </label>
                  <input
                    id="supadata-api-key"
                    type="text"
                    value={supadataApiKey}
                    onChange={(e) => setSupadataApiKey(e.target.value)}
                    placeholder="Enter your SUPADATA API key"
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-white placeholder-gray-400 transition-all duration-300"
                  />
                  <p className="text-xs text-gray-400">
                    Get your key at <a href="https://supadata.ai" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">https://supadata.ai</a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="deepseek-api-key" className="block text-lg font-medium text-gray-300">
                    DEEPSEEK API Key
                  </label>
                  <input
                    id="deepseek-api-key"
                    type="text"
                    value={deepseekApiKey}
                    onChange={(e) => setDeepseekApiKey(e.target.value)}
                    placeholder="Enter your DEEPSEEK API key"
                    className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-white placeholder-gray-400 transition-all duration-300"
                  />
                  <p className="text-xs text-gray-400">
                    Get your key at <a href="https://deepseek.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">https://deepseek.com</a>
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/25"
                  >
                    Save Keys
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApiKeyForm(false)}
                    className="flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-gray-800/30 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50 transition-all duration-300 hover:shadow-purple-500/10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="youtube-url" className="block text-lg font-medium text-gray-300">
                    YouTube URL
                  </label>
                  <div className="relative">
                    <input
                      id="youtube-url"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-white placeholder-gray-400 transition-all duration-300"
                      disabled={loading}
                    />
                    {loading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform
                      ${loading || !url.trim()
                        ? 'bg-gray-600 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-purple-500/25'
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Transcribing...</span>
                      </div>
                    ) : (
                      'Transcribe Video'
                    )}
                  </button>
                  
                  {savedApiKeys && (
                    <button
                      type="button"
                      onClick={() => setShowApiKeyForm(true)}
                      className="py-2 px-4 rounded-xl text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all duration-300"
                    >
                      Change API Keys
                    </button>
                  )}
                  
                  {!savedApiKeys && (
                    <button
                      type="button"
                      onClick={() => setShowApiKeyForm(true)}
                      className="py-2 px-4 rounded-xl text-sm font-medium text-purple-400 border border-purple-500/30 hover:bg-purple-500/10 transition-all duration-300"
                    >
                      Set API Keys
                    </button>
                  )}
                </div>
              </form>

              {error && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-fadeIn">
                  <p>{error}</p>
                  {(error.includes('API key') || error.includes('API configuration') || error.includes('authentication')) && (
                    <button
                      onClick={() => setShowApiKeyForm(true)}
                      className="mt-2 text-purple-400 hover:underline"
                    >
                      Set your API keys
                    </button>
                  )}
                </div>
              )}

              {loading && (
                <div className="mt-8 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
                  <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-purple-500/20 animate-ping"></div>
                    <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-b-purple-500 animate-spin"></div>
                  </div>
                  <p className="text-gray-400">Processing your video...</p>
                </div>
              )}

              {(transcript || summary) && (
                <div className="mt-8 space-y-8 animate-fadeIn">
                  {summary && (
                    <div className="animate-fadeIn">
                      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        {summary.title}
                      </h2>
                      
                      <div className="space-y-6">
                        {/* Quick Summary */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
                          <p className="text-lg text-gray-300 leading-relaxed">
                            {summary.quickSummary}
                          </p>
                        </div>

                        {/* Main Points */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20">
                          <h3 className="text-xl font-semibold mb-4 text-pink-400">
                            Key Points
                          </h3>
                          <div className="space-y-4">
                            {summary.mainPoints.map((point, index) => (
                              <div key={index} className="pl-4 border-l-2 border-pink-500">
                                <h4 className="text-lg font-medium text-pink-300 mb-2">
                                  {point.point}
                                </h4>
                                <p className="text-gray-300">
                                  {point.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Highlights */}
                        {summary.highlights.length > 0 && (
                          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
                            <h3 className="text-xl font-semibold mb-4 text-blue-400">
                              Highlights
                            </h3>
                            <div className="space-y-3">
                              {summary.highlights.map((highlight, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                  <div className="flex-shrink-0 w-16 text-blue-400 font-mono">
                                    {highlight.timestamp || '--:--'}
                                  </div>
                                  <p className="text-gray-300">
                                    {highlight.moment}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Conclusions */}
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
                          <h3 className="text-xl font-semibold mb-4 text-purple-400">
                            Key Takeaways
                          </h3>
                          <p className="text-gray-300 leading-relaxed">
                            {summary.keyConclusions}
                          </p>
                        </div>

                        {/* References */}
                        {summary.references.length > 0 && (
                          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-500/20">
                            <h3 className="text-xl font-semibold mb-4 text-gray-400">
                              References
                            </h3>
                            <div className="space-y-2">
                              {summary.references.map((ref, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                  <span className="text-gray-400">{ref.type}:</span>
                                  <span className="text-gray-300">{ref.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {transcript && (
                    <div>
                      <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        Full Transcript
                      </h2>
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 overflow-auto max-h-[500px] whitespace-pre-wrap text-gray-300 border border-gray-700/50 shadow-inner transition-all duration-300 hover:shadow-purple-500/5">
                        {transcript}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <footer className="mt-16 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 Juan Diego Hernandez. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}
