'use client'

import { Message } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatDateShort } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface BIFFAnalyticsProps {
  messages: Message[]
}

export default function BIFFAnalytics({ messages }: BIFFAnalyticsProps) {
  if (messages.length === 0) {
    return null
  }

  // Prepare data for chart - group by date
  const chartData = messages.map((msg, index) => ({
    index: index + 1,
    date: formatDateShort(msg.created_at),
    biffScore: msg.biff_score,
    sender: (msg.sender as any)?.full_name || 'Unknown'
  }))

  // Calculate trend
  const firstHalf = messages.slice(0, Math.floor(messages.length / 2))
  const secondHalf = messages.slice(Math.floor(messages.length / 2))

  const avgFirstHalf = firstHalf.reduce((sum, msg) => sum + msg.biff_score, 0) / firstHalf.length
  const avgSecondHalf = secondHalf.reduce((sum, msg) => sum + msg.biff_score, 0) / secondHalf.length

  const trend = avgSecondHalf - avgFirstHalf
  const trendPercentage = ((trend / avgFirstHalf) * 100).toFixed(1)

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">BIFF Score Analytics</h2>

        {/* Trend Indicator */}
        <div className="flex items-center gap-2">
          {trend > 5 ? (
            <>
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-400">
                Improving (+{trendPercentage}%)
              </span>
            </>
          ) : trend < -5 ? (
            <>
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-400">
                Declining ({trendPercentage}%)
              </span>
            </>
          ) : (
            <>
              <Minus className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-400">
                Stable
              </span>
            </>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="index"
              stroke="#94a3b8"
              label={{ value: 'Message Number', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
            />
            <YAxis
              stroke="#94a3b8"
              domain={[0, 100]}
              label={{ value: 'BIFF Score', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '6px'
              }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="biffScore"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 3 }}
              name="BIFF Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-slate-900 rounded p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Excellent (90-100)</p>
          <p className="text-lg font-bold text-green-400">
            {messages.filter(m => m.biff_score >= 90).length}
          </p>
        </div>
        <div className="bg-slate-900 rounded p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Good (70-89)</p>
          <p className="text-lg font-bold text-yellow-400">
            {messages.filter(m => m.biff_score >= 70 && m.biff_score < 90).length}
          </p>
        </div>
        <div className="bg-slate-900 rounded p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">Needs Work (&lt;70)</p>
          <p className="text-lg font-bold text-red-400">
            {messages.filter(m => m.biff_score < 70).length}
          </p>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded">
        <p className="text-sm text-blue-300">
          <strong>Communication Insight:</strong> {
            trend > 10
              ? 'Communication quality is significantly improving over time. Positive trend detected.'
              : trend < -10
              ? 'Communication quality is declining. Consider intervention or mediation.'
              : 'Communication quality remains relatively stable throughout the conversation.'
          }
        </p>
      </div>
    </div>
  )
}
