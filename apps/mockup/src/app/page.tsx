'use client';

import { useState } from 'react';
import Script from 'next/script';

export default function Home() {
  const [activeModule, setActiveModule] = useState('chat');

  const modules = {
    chat: {
      title: 'Guided\nChat.',
      description: 'Court-ready messaging with real-time AI coaching. Every message is unalterable, encrypted, and timestamped for your protection.',
      activity: 'Last message received',
      activityTime: '2h ago',
      statusText: 'AI Coach is active and monitoring',
      statusColor: 'emerald'
    },
    biff: {
      title: 'BIFF\nCoaching.',
      description: 'Real-time scoring: Brief, Informative, Friendly, Firm. AI helps you write better messages that reduce conflict.',
      activity: 'Average BIFF score this week',
      activityTime: '78%',
      statusText: '+15% improvement from last week',
      statusColor: 'sky'
    },
    shield: {
      title: 'Message\nShield.',
      description: 'AI neutralizes hostile messages before you see them. Facts preserved, manipulation removed. Protect your mental health.',
      activity: 'Messages filtered today',
      activityTime: '3',
      statusText: 'Shield active and protecting',
      statusColor: 'emerald'
    },
    grayrock: {
      title: 'Gray Rock\nMode.',
      description: 'AI-generated minimal, emotionally flat responses. Activate during high-conflict periods to reduce engagement.',
      activity: 'Mode status',
      activityTime: 'Inactive',
      statusText: 'Ready to activate when needed',
      statusColor: 'slate'
    },
    solo: {
      title: 'Solo\nMode.',
      description: 'Works even if co-parent refuses to join. SMS/email bridging with full message shield and court-ready archiving.',
      activity: 'Messages bridged this month',
      activityTime: '47',
      statusText: 'Bridge active and monitoring',
      statusColor: 'emerald'
    },
    portal: {
      title: 'Attorney\nPortal.',
      description: 'Free access for legal professionals. Certified PDF exports with SHA-256 verification and chronological message archives.',
      activity: 'Portal access status',
      activityTime: 'Active',
      statusText: 'Attorney can view all messages',
      statusColor: 'emerald'
    },
    patterns: {
      title: 'Pattern\nRecognition.',
      description: 'AI detects manipulation: DARVO, gaslighting, manufactured urgency, boundary testing. Document patterns for legal proceedings.',
      activity: 'Patterns detected this month',
      activityTime: '5',
      statusText: 'Monitoring for manipulation patterns',
      statusColor: 'amber'
    }
  };

  const currentModule = modules[activeModule as keyof typeof modules];

  return (
    <>
      <Script src="https://unpkg.com/@phosphor-icons/web" strategy="beforeInteractive" />
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .nav-item.active { background-color: rgba(255,255,255,0.05); border-right: 3px solid #38bdf8; }
      `}</style>

      <div className="min-h-screen bg-[#d1d5db] flex items-center justify-center">
        <div className="w-[414px] h-[896px] bg-[#0f172a] rounded-[40px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex">

          {/* Side Navigation */}
          <nav className="w-[80px] h-full bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-10 shrink-0">
            <div className="mb-12">
              <i className="ph-fill ph-chat-circle-dots text-2xl text-sky-400"></i>
            </div>

            <div className="flex flex-col gap-8 w-full">
              <button
                onClick={() => setActiveModule('chat')}
                className={`nav-item flex flex-col items-center py-4 w-full transition-all ${activeModule === 'chat' ? 'active text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="ph-bold ph-chats text-xl mb-1"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest">Chat</span>
              </button>

              <button
                onClick={() => setActiveModule('biff')}
                className={`nav-item flex flex-col items-center py-4 w-full transition-all ${activeModule === 'biff' ? 'active text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="ph-bold ph-chart-line-up text-xl mb-1"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest">BIFF</span>
              </button>

              <button
                onClick={() => setActiveModule('shield')}
                className={`nav-item flex flex-col items-center py-4 w-full transition-all ${activeModule === 'shield' ? 'active text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="ph-bold ph-shield-check text-xl mb-1"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest">Shield</span>
              </button>

              <button
                onClick={() => setActiveModule('grayrock')}
                className={`nav-item flex flex-col items-center py-4 w-full transition-all ${activeModule === 'grayrock' ? 'active text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="ph-bold ph-target text-xl mb-1"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest">Gray</span>
              </button>

              <button
                onClick={() => setActiveModule('solo')}
                className={`nav-item flex flex-col items-center py-4 w-full transition-all ${activeModule === 'solo' ? 'active text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="ph-bold ph-user text-xl mb-1"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest">Solo</span>
              </button>

              <button
                onClick={() => setActiveModule('portal')}
                className={`nav-item flex flex-col items-center py-4 w-full transition-all ${activeModule === 'portal' ? 'active text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="ph-bold ph-briefcase text-xl mb-1"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest">Legal</span>
              </button>

              <button
                onClick={() => setActiveModule('patterns')}
                className={`nav-item flex flex-col items-center py-4 w-full transition-all ${activeModule === 'patterns' ? 'active text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <i className="ph-bold ph-detective text-xl mb-1"></i>
                <span className="text-[10px] font-bold uppercase tracking-widest">Pattern</span>
              </button>
            </div>

            <div className="mt-auto">
              <button className="p-3 text-slate-500 hover:text-slate-300">
                <i className="ph ph-gear-six text-xl"></i>
              </button>
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 h-full overflow-y-auto no-scrollbar flex flex-col bg-[#1e293b]">
            {/* Header */}
            <header className="p-8 pb-0 flex justify-between items-start">
              <h1 className="text-[14px] font-bold tracking-tight text-sky-500 opacity-80 uppercase">ClearTalk</h1>
              <div className="flex gap-4 text-slate-400">
                <i className="ph ph-magnifying-glass text-xl hover:text-white cursor-pointer"></i>
                <i className="ph ph-bell text-xl hover:text-white cursor-pointer"></i>
              </div>
            </header>

            {/* Module Content */}
            <section className="flex-1 p-8 flex flex-col">
              <div className="mt-12">
                <h2 className="text-[52px] leading-[0.95] font-bold text-slate-50 tracking-tighter whitespace-pre-line">
                  {currentModule.title}
                </h2>

                <p className="mt-10 text-[18px] leading-[1.5] font-medium text-slate-300 opacity-90">
                  {currentModule.description}
                </p>

                <div className="mt-12 flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-[#0f172a] transition-transform group-hover:scale-110">
                    <i className="ph ph-arrow-right text-xl font-bold"></i>
                  </div>
                  <span className="text-[16px] font-bold border-b-2 border-sky-500 text-slate-100">Open Workspace</span>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="mt-auto grid grid-cols-1 gap-6 pt-8 border-t border-slate-700">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="block text-[12px] uppercase tracking-wider font-bold text-sky-500/60 mb-1">Recent Activity</span>
                    <span className="block text-[15px] font-bold text-slate-200">{currentModule.activity}</span>
                  </div>
                  <span className="text-[15px] font-medium text-slate-500">{currentModule.activityTime}</span>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${
                    currentModule.statusColor === 'emerald' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                    currentModule.statusColor === 'sky' ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' :
                    currentModule.statusColor === 'amber' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                    'bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]'
                  }`}></div>
                  <span className="text-[13px] font-bold text-slate-300">{currentModule.statusText}</span>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
