'use client'

import { Message } from '@/lib/supabase'
import { formatDate, getBIFFScoreColor } from '@/lib/utils'
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react'

interface MessageTimelineProps {
  messages: Message[]
}

export default function MessageTimeline({ messages }: MessageTimelineProps) {
  if (messages.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
        <p className="text-gray-400">No messages in this conversation yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Message Timeline</h2>

      {messages.map((message, index) => (
        <div
          key={message.id}
          className="bg-slate-800 rounded-lg border border-slate-700 p-6 hover:border-slate-600 transition-colors"
        >
          {/* Message Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {(message.sender as any)?.full_name || 'Unknown Sender'}
                </span>
                <span className="text-xs text-gray-500">
                  to {(message.recipient as any)?.full_name || 'Unknown Recipient'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {formatDate(message.created_at)}
              </p>
            </div>

            {/* BIFF Score Badge */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-gray-400">BIFF Score</p>
                <p className={`text-lg font-bold ${getBIFFScoreColor(message.biff_score)}`}>
                  {message.biff_score}
                </p>
              </div>
              {message.was_filtered ? (
                <ShieldAlert className="h-6 w-6 text-yellow-500" title="Content filtered" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-green-500" title="No filtering applied" />
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-3">
            {message.was_filtered ? (
              <>
                <div className="bg-green-900/20 border border-green-700 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-green-400" />
                    <span className="text-xs font-medium text-green-400">Filtered Content (Delivered)</span>
                  </div>
                  <p className="text-sm text-gray-300">{message.filtered_content}</p>
                </div>
                <div className="bg-red-900/20 border border-red-700 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-xs font-medium text-red-400">Original Content (Blocked)</span>
                  </div>
                  <p className="text-sm text-gray-300">{message.original_content}</p>
                </div>
              </>
            ) : (
              <div className="bg-slate-900 border border-slate-700 rounded p-3">
                <p className="text-sm text-gray-300">{message.original_content}</p>
              </div>
            )}
          </div>

          {/* Pattern Flags */}
          {message.pattern_flags && message.pattern_flags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-gray-400 mb-2">Detected Patterns:</p>
              <div className="flex flex-wrap gap-2">
                {message.pattern_flags.map((pattern, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-orange-900/30 border border-orange-700 rounded text-xs text-orange-300"
                  >
                    {pattern}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Hostile Language Indicator */}
          {message.hostile_language_count > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span>{message.hostile_language_count} hostile language instance(s) detected</span>
            </div>
          )}

          {/* Message Hash (for verification) */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <details className="text-xs">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                Message Hash (verification)
              </summary>
              <div className="mt-2 bg-slate-900 rounded p-2 font-mono text-gray-500 break-all">
                {message.message_hash}
              </div>
            </details>
          </div>
        </div>
      ))}
    </div>
  )
}
