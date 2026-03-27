'use client';

import { useState } from 'react';
import { Send, Shield, Settings, FileText, MessageSquare } from 'lucide-react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [shieldEnabled, setShieldEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'compose' | 'shield' | 'portal'>('chat');

  //Mock BIFF scores
  const biffScores = {
    brief: message.length > 100 ? 45 : 85,
    informative: message.includes('I think') || message.includes('You always') ? 40 : 80,
    friendly: message.includes('!') || message.toLowerCase().includes('please') ? 90 : 60,
    firm: message.length > 20 ? 75 : 50,
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const mockMessages = [
    { id: 1, sender: 'them', content: 'Can you take the kids this weekend? I have plans.', time: '2:30 PM', shielded: false },
    { id: 2, sender: 'me', content: 'I can take them Saturday afternoon. What time?', time: '2:45 PM', shielded: false },
    { id: 3, sender: 'them', content: 'You NEVER help out when I need you. This is exactly why we have problems. You\'re so selfish and unreliable. I shouldn\'t have to ask you to spend time with YOUR OWN CHILDREN.', time: '3:00 PM', shielded: true, originalContent: 'You NEVER help out when I need you. This is exactly why we have problems. You\'re so selfish and unreliable. I shouldn\'t have to ask you to spend time with YOUR OWN CHILDREN.', shieldedContent: 'I need you to take the children this weekend. Can you confirm your availability?', hostilityLevel: 'severe' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ClearTalk</h1>
              <p className="text-sm text-gray-600">AI-Powered Co-Parenting</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Design Mockup for Variant.com</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex space-x-2 border-b border-gray-200">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'compose', label: 'Compose + BIFF', icon: Send },
            { id: 'shield', label: 'Message Shield', icon: Shield },
            { id: 'portal', label: 'Pro Portal', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'chat' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Mobile Chat Interface */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
                <h2 className="text-lg font-semibold">Chat with Co-Parent</h2>
                <p className="text-sm text-blue-100">All messages are unalterable and court-ready</p>
              </div>
              <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-gray-50">
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.sender === 'me' ? 'bg-blue-600 text-white' : 'bg-white'} rounded-2xl px-4 py-3 shadow`}>
                      {msg.shielded && shieldEnabled ? (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Shield className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">Shielded</span>
                          </div>
                          <p className="text-sm">{msg.shieldedContent}</p>
                          <button className="text-xs text-gray-500 hover:text-gray-700 mt-2 underline">
                            View original (hostile)
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm">{msg.content}</p>
                      )}
                      <span className="text-xs opacity-70 mt-1 block">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                  <h3 className="text-xl font-semibold">Incoming Message Shield</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  AI neutralizes hostile messages <strong>before</strong> you see them. Preserves all facts and logistics, removes emotional manipulation.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Shield Mode</span>
                    <select className="border border-gray-300 rounded-lg px-3 py-1 text-sm">
                      <option>Full Shield</option>
                      <option>Annotated</option>
                      <option>Off</option>
                    </select>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Pattern Detected:</strong> Manufactured urgency - Co-parent creates false deadlines to pressure quick responses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Court-Ready Records</h3>
                <ul className="space-y-3">
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Unalterable Messages</p>
                      <p className="text-sm text-gray-600">SHA-256 hash chain ensures tamper evidence</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Certified PDF Exports</p>
                      <p className="text-sm text-gray-600">One-click export with digital certification</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium">Free Attorney Portal</p>
                      <p className="text-sm text-gray-600">Read-only access for legal professionals</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compose' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Compose Interface */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 text-white">
                <h2 className="text-lg font-semibold">Compose Message</h2>
                <p className="text-sm text-purple-100">Real-time BIFF coaching as you type</p>
              </div>
              <div className="p-6 space-y-6">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />

                {/* BIFF Score Visualization */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">BIFF Score</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Brief', score: biffScores.brief, desc: 'Concise, no history' },
                      { label: 'Informative', score: biffScores.informative, desc: 'Facts, not opinions' },
                      { label: 'Friendly', score: biffScores.friendly, desc: 'Neutral to warm tone' },
                      { label: 'Firm', score: biffScores.firm, desc: 'Clear without aggression' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-sm text-gray-600">{item.score}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${getScoreColor(item.score)}`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {message && biffScores.informative < 60 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-900">
                      <strong>Coaching Tip:</strong> Try replacing opinions ("I think", "You always") with specific facts and logistics.
                    </p>
                  </div>
                )}

                <button className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  Get BIFF Rewrite Suggestions
                </button>
              </div>
            </div>

            {/* BIFF Explanation */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">What is BIFF?</h3>
                <p className="text-gray-700 mb-4">
                  BIFF is a communication method developed by Bill Eddy for high-conflict situations. ClearTalk uses AI to help you write BIFF-compliant messages automatically.
                </p>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-purple-600">Brief</h4>
                    <p className="text-sm text-gray-600">Keep it short. No lectures, no rehashing history.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600">Informative</h4>
                    <p className="text-sm text-gray-600">State facts and logistics. No opinions or blame.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600">Friendly</h4>
                    <p className="text-sm text-gray-600">Neutral to warm tone. No sarcasm or passive aggression.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-600">Firm</h4>
                    <p className="text-sm text-gray-600">Clear position stated without being aggressive.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Score History</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">This week</span>
                    <span className="font-semibold text-green-600">+15% improvement</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">This month</span>
                    <span className="font-semibold text-green-600">+22% improvement</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Your BIFF compliance is improving! This demonstrates effort to communicate constructively - valuable for court proceedings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shield' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
                <h2 className="text-lg font-semibold">Message Shield Demo</h2>
                <p className="text-sm text-green-100">See how AI neutralizes hostile messages</p>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Original Message (Hostile)</h3>
                  <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                    <p className="text-gray-900">
                      "You NEVER help out when I need you. This is exactly why we have problems. You're so selfish and unreliable. I shouldn't have to ask you to spend time with YOUR OWN CHILDREN. If you cared about them at all, you'd make this work. But clearly you don't. Fine, I'll find someone else who actually cares."
                    </p>
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="px-3 py-1 bg-red-600 text-white text-xs rounded-full">Severe Hostility</div>
                      <div className="px-3 py-1 bg-orange-600 text-white text-xs rounded-full">Personal Attack</div>
                      <div className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-full">Manufactured Urgency</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-3 text-green-600">
                    <Shield className="w-8 h-8" />
                    <span className="font-semibold">AI Shield Processing...</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">Shielded Message (Neutralized)</h3>
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <p className="text-gray-900">
                      "I need you to take the children this weekend. Can you confirm your availability?"
                    </p>
                    <div className="mt-4 flex items-center space-x-2">
                      <div className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">Factual Content Preserved</div>
                      <div className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">Neutral Tone</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">What the Shield Did:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Extracted core request: "take the children this weekend"</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Removed personal attacks and blame</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Eliminated manufactured urgency and emotional manipulation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Reframed as neutral, actionable request</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium underline">
                    View Original Message
                  </button>
                  <span className="text-xs text-gray-500">Original preserved in legal record</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portal' && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Attorney Portal */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 text-white">
                <h2 className="text-lg font-semibold">Professional Portal</h2>
                <p className="text-sm text-indigo-100">Attorney / Mediator / Judge Access</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Client: Alexandra Roberts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Case Number:</span>
                      <span className="font-medium">FL-2024-0123</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Messages:</span>
                      <span className="font-medium">347</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date Range:</span>
                      <span className="font-medium">Jan 2024 - Present</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold mb-3">Recent Messages</h4>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">From: Scott Gardenhire</span>
                          <span className="text-xs text-gray-500">2h ago</span>
                        </div>
                        <p className="text-sm">Message preview text goes here...</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div className="w-16 h-1.5 bg-green-500 rounded-full" title="Brief: 85/100" />
                          <div className="w-16 h-1.5 bg-yellow-500 rounded-full" title="Informative: 60/100" />
                          <div className="w-16 h-1.5 bg-green-500 rounded-full" title="Friendly: 90/100" />
                          <div className="w-16 h-1.5 bg-green-500 rounded-full" title="Firm: 75/100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Export Certified PDF</span>
                </button>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Professional Features</h3>
                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Certified PDF Exports</p>
                      <p className="text-sm text-gray-600">One-click export with SHA-256 certification for court submission</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Shield className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Pattern Recognition Reports</p>
                      <p className="text-sm text-gray-600">AI-detected manipulation patterns (DARVO, gaslighting, etc.)</p>
                    </div>
                  </li>
                  <li className="flex items-start space-x-3">
                    <Settings className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Read-Only Access</p>
                      <p className="text-sm text-gray-600">View all communication without ability to modify records</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold mb-4">Court Order Templates</h3>
                <p className="text-gray-700 mb-4">
                  Model language for custody agreements that specify ClearTalk as the mandated communication platform.
                </p>
                <div className="space-y-2">
                  {['California', 'New York', 'Texas', 'Illinois', 'Florida'].map((state) => (
                    <button
                      key={state}
                      className="w-full text-left px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      {state} Template
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build ClearTalk?</h2>
          <p className="text-lg mb-6">
            This mockup showcases the core features. Share with Variant.com for professional design feedback.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Deploy to Vercel
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              View PRD
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm text-gray-400">
            ClearTalk Design Mockup - Built with Claude Code Agent Teams
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Messaging that makes co-parenting less painful
          </p>
        </div>
      </footer>
    </div>
  );
}
