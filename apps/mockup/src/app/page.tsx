'use client';

import { useState } from 'react';

export default function Home() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-4">
      <div className="w-full max-w-[414px] h-[896px] bg-white shadow-2xl overflow-y-auto scrollbar-hide flex flex-col">
        {/* Top Navigation */}
        <header className="sticky top-0 z-10 bg-white px-5 py-4 flex items-center justify-between">
          <div className="w-6 h-6 flex items-center justify-center cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0F0F0F]">
              <circle cx="5" cy="5" r="2" />
              <circle cx="12" cy="5" r="2" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
              <circle cx="5" cy="19" r="2" />
              <circle cx="12" cy="19" r="2" />
              <circle cx="19" cy="19" r="2" />
            </svg>
          </div>
          <div className="text-[13px] font-bold tracking-[0.2px]">ClearTalk</div>
          <div className="w-6 h-6 flex items-center justify-center cursor-pointer">
            <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-[#0F0F0F] fill-none stroke-2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-direction-column">
          {/* Guided Chat Module */}
          <a
            href="#"
            className="w-full px-5 py-8 pb-6 bg-[#E8DFD5] flex flex-col relative active:opacity-95"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('chat');
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px]">
                Guided<br />Chat
              </h2>
              <div className="w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" className="w-full h-full stroke-[#0F0F0F] fill-none stroke-[1.2]">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] font-semibold leading-[1.3] max-w-[85%] mb-10">
              Court-ready messaging with real-time AI coaching. Every message unalterable and timestamped.
            </p>
            <div className="mt-auto">
              <div className="h-[1px] bg-[rgba(15,15,15,0.2)] w-full mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium tracking-[0.2px]">Last message: 2 hours ago</span>
                <span className="text-[11px] font-medium tracking-[0.2px]">Open Chat</span>
              </div>
            </div>
          </a>

          {/* BIFF Analysis Module */}
          <a
            href="#"
            className="w-full px-5 py-8 pb-6 bg-[#DFDEDE] flex flex-col relative active:opacity-95"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('biff');
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px]">
                BIFF<br />Coaching
              </h2>
              <div className="w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" className="w-full h-full stroke-[#0F0F0F] fill-none stroke-[1.2]">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] font-semibold leading-[1.3] max-w-[85%] mb-4">
              Real-time scoring: Brief, Informative, Friendly, Firm. AI helps you write better messages.
            </p>

            {/* BIFF Visualization */}
            <div className="flex gap-3 mt-4 mb-6">
              {[
                { label: 'B', width: 85 },
                { label: 'I', width: 60 },
                { label: 'F', width: 40 },
                { label: 'F', width: 90 },
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.5px]">{bar.label}</span>
                  <div className="h-[2px] bg-[rgba(15,15,15,0.2)] w-full relative">
                    <div
                      className="absolute top-0 left-0 h-full bg-[#0F0F0F]"
                      style={{ width: `${bar.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <div className="h-[1px] bg-[rgba(15,15,15,0.2)] w-full mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium tracking-[0.2px]">This week: +15% improvement</span>
                <span className="text-[11px] font-medium tracking-[0.2px]">View Trends</span>
              </div>
            </div>
          </a>

          {/* Message Shield Module */}
          <a
            href="#"
            className="w-full px-5 py-8 pb-6 bg-[#DF6544] flex flex-col relative active:opacity-95"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('shield');
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px]">
                Message<br />Shield
              </h2>
              <div className="w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" className="w-full h-full stroke-[#0F0F0F] fill-none stroke-[1.2]">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] font-semibold leading-[1.3] max-w-[85%] mb-3">
              AI neutralizes hostile messages before you see them. Facts preserved, manipulation removed.
            </p>

            {/* Shield Demo */}
            <div className="mt-3 mb-6 border border-[#0F0F0F] p-3 bg-[rgba(255,255,255,0.1)]">
              <p className="text-[13px] font-medium leading-[1.4]">
                "You always{' '}
                <span className="bg-[#0F0F0F] text-[#DF6544] px-1 font-mono text-[11px] tracking-[2px]">
                  [FILTERED]
                </span>{' '}
                and never listen to me."
              </p>
            </div>

            <div className="mt-auto">
              <div className="h-[1px] bg-[rgba(15,15,15,0.2)] w-full mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium tracking-[0.2px]">3 messages shielded today</span>
                <span className="text-[11px] font-medium tracking-[0.2px]">Review Log</span>
              </div>
            </div>
          </a>

          {/* Gray Rock Mode Module */}
          <a
            href="#"
            className="w-full px-5 py-8 pb-6 bg-[#E8DFD5] flex flex-col relative active:opacity-95"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('grayrock');
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px]">
                Gray Rock<br />Mode
              </h2>
              <div className="w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" className="w-full h-full stroke-[#0F0F0F] fill-none stroke-[1.2]">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] font-semibold leading-[1.3] max-w-[85%] mb-10">
              AI-generated minimal, emotionally flat responses. Activate during high-conflict periods.
            </p>
            <div className="mt-auto">
              <div className="h-[1px] bg-[rgba(15,15,15,0.2)] w-full mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium tracking-[0.2px]">Status: Inactive</span>
                <span className="text-[11px] font-medium tracking-[0.2px]">Activate</span>
              </div>
            </div>
          </a>

          {/* Solo Mode Module */}
          <a
            href="#"
            className="w-full px-5 py-8 pb-6 bg-[#DFDEDE] flex flex-col relative active:opacity-95"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('solo');
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px]">
                Solo<br />Mode
              </h2>
              <div className="w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" className="w-full h-full stroke-[#0F0F0F] fill-none stroke-[1.2]">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] font-semibold leading-[1.3] max-w-[85%] mb-10">
              Works even if co-parent refuses to join. SMS/email bridging with full message shield.
            </p>
            <div className="mt-auto">
              <div className="h-[1px] bg-[rgba(15,15,15,0.2)] w-full mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium tracking-[0.2px]">47 messages bridged</span>
                <span className="text-[11px] font-medium tracking-[0.2px]">Configure</span>
              </div>
            </div>
          </a>

          {/* Attorney Portal Module */}
          <a
            href="#"
            className="w-full px-5 py-8 pb-6 bg-[#E8DFD5] flex flex-col relative active:opacity-95"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('portal');
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px]">
                Attorney<br />Portal
              </h2>
              <div className="w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" className="w-full h-full stroke-[#0F0F0F] fill-none stroke-[1.2]">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] font-semibold leading-[1.3] max-w-[85%] mb-10">
              Free access for legal professionals. Certified PDF exports with SHA-256 verification.
            </p>
            <div className="mt-auto">
              <div className="h-[1px] bg-[rgba(15,15,15,0.2)] w-full mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium tracking-[0.2px]">Access: Active</span>
                <span className="text-[11px] font-medium tracking-[0.2px]">Manage Access</span>
              </div>
            </div>
          </a>

          {/* Pattern Recognition Module */}
          <a
            href="#"
            className="w-full px-5 py-8 pb-6 bg-[#DF6544] flex flex-col relative active:opacity-95"
            onClick={(e) => {
              e.preventDefault();
              setActiveModule('patterns');
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-[28px] font-bold leading-[1.1] tracking-[-0.5px]">
                Pattern<br />Recognition
              </h2>
              <div className="w-6 h-6 mt-1">
                <svg viewBox="0 0 24 24" className="w-full h-full stroke-[#0F0F0F] fill-none stroke-[1.2]">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <p className="text-[14px] font-semibold leading-[1.3] max-w-[85%] mb-3">
              AI detects manipulation: DARVO, gaslighting, manufactured urgency, boundary testing.
            </p>

            {/* Pattern Demo */}
            <div className="mt-3 mb-6 border border-[#0F0F0F] p-3 bg-[rgba(255,255,255,0.1)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.5px] mb-2">DETECTED</p>
              <p className="text-[13px] font-medium leading-[1.4]">
                Manufactured urgency pattern identified in 3 recent messages.
              </p>
            </div>

            <div className="mt-auto">
              <div className="h-[1px] bg-[rgba(15,15,15,0.2)] w-full mb-3" />
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-medium tracking-[0.2px]">5 patterns this month</span>
                <span className="text-[11px] font-medium tracking-[0.2px]">View Report</span>
              </div>
            </div>
          </a>

          {/* Footer Info */}
          <div className="w-full px-5 py-12 bg-white text-center">
            <p className="text-[11px] font-medium text-[#0F0F0F] opacity-60 mb-2">
              ClearTalk Design Mockup
            </p>
            <p className="text-[9px] font-medium text-[#0F0F0F] opacity-40">
              Messaging that makes co-parenting less painful
            </p>
            <p className="text-[9px] font-medium text-[#0F0F0F] opacity-40 mt-4">
              Share with Variant.com for design feedback
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
