'use client';

import { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTranscript('');
    setSummary(null);

    try {
      console.log('Sending request with URL:', url);
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      console.log('Response received:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to transcribe video');
      }

      if (!data.content) {
        throw new Error('No transcript content received');
      }

      setTranscript(data.content);

      // Generar resumen
      setSummarizing(true);
      try {
        const summaryResponse = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ transcript: data.content })
        });

        const summaryData = await summaryResponse.json();

        if (!summaryResponse.ok) {
          throw new Error(summaryData.error || 'Failed to generate summary');
        }

        setSummary(JSON.parse(summaryData.summary));
      } catch (err) {
        console.error('Summary error:', err);
        setError('Failed to generate summary. You can still view the full transcript below.');
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

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform
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
            </form>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 animate-fadeIn">
                <p>{error}</p>
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
