'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { Message, Conversation, User } from '@/lib/supabase'
import { generateCourtReadyPDF } from '@/lib/pdf-generator'
import { verifyMessageChain } from '@/lib/hash-verifier'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Download, Loader2, FileText, Shield } from 'lucide-react'
import Link from 'next/link'

export default function ExportPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [attorney, setAttorney] = useState<User | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()

      try {
        // Get session
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        // Get attorney info
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!userData) {
          router.push('/login')
          return
        }

        setAttorney(userData)

        // Verify access
        const { data: access } = await supabase
          .from('professional_access')
          .select('access_level')
          .eq('professional_id', session.user.id)
          .eq('conversation_id', params.id as string)
          .single()

        if (!access || access.access_level !== 'export') {
          router.push('/clients')
          return
        }

        // Get conversation
        const { data: convData } = await supabase
          .from('conversations')
          .select(`
            id,
            case_number,
            jurisdiction,
            status,
            created_at,
            participant_a:users!conversations_participant_a_id_fkey (*),
            participant_b:users!conversations_participant_b_id_fkey (*)
          `)
          .eq('id', params.id as string)
          .single()

        if (convData) {
          setConversation(convData)
        }

        // Get messages
        const { data: msgData } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey (*),
            recipient:users!messages_recipient_id_fkey (*)
          `)
          .eq('conversation_id', params.id as string)
          .order('created_at', { ascending: true })

        if (msgData) {
          setMessages(msgData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id, router])

  const handleExport = async () => {
    if (!conversation || !attorney || messages.length === 0) return

    setExporting(true)

    try {
      // Verify hash chain
      const hashVerificationResults = await verifyMessageChain(messages)

      // Generate PDF
      const pdf = await generateCourtReadyPDF({
        conversation,
        messages,
        attorney,
        caseNumber: conversation.case_number || undefined,
        jurisdiction: conversation.jurisdiction || undefined,
        hashVerificationResults
      })

      // Generate filename
      const participantA = (conversation.participant_a as any)?.full_name || 'Unknown'
      const participantB = (conversation.participant_b as any)?.full_name || 'Unknown'
      const date = new Date().toISOString().split('T')[0]
      const filename = `ClearTalk_Conversation_${participantA}_${participantB}_${date}.pdf`

      // Download
      pdf.save(filename)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading conversation data...</span>
        </div>
      </div>
    )
  }

  if (!conversation || !attorney) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Unable to load conversation data.</p>
          <Link href="/clients" className="text-blue-400 hover:underline">
            Return to Clients
          </Link>
        </div>
      </div>
    )
  }

  const participantA = (conversation.participant_a as any)?.full_name || 'Unknown'
  const participantB = (conversation.participant_b as any)?.full_name || 'Unknown'

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/clients/${params.id}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Export to PDF</h1>
              <p className="text-sm text-gray-400">
                {participantA} & {participantB}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8">
          {/* Export Info */}
          <div className="flex items-start gap-4 mb-8">
            <FileText className="h-12 w-12 text-blue-500" />
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Court-Ready PDF Export</h2>
              <p className="text-gray-400">
                This will generate a certified PDF document suitable for court proceedings.
                The document includes all messages, BIFF scores, pattern detection, and cryptographic
                verification.
              </p>
            </div>
          </div>

          {/* Export Details */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400">Case Number:</span>
              <span className="text-white font-medium">{conversation.case_number || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400">Jurisdiction:</span>
              <span className="text-white font-medium">{conversation.jurisdiction || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400">Total Messages:</span>
              <span className="text-white font-medium">{messages.length}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400">Exported By:</span>
              <span className="text-white font-medium">{attorney.full_name}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <span className="text-gray-400">Date Range:</span>
              <span className="text-white font-medium">
                {messages.length > 0
                  ? `${new Date(messages[0].created_at).toLocaleDateString()} - ${new Date(messages[messages.length - 1].created_at).toLocaleDateString()}`
                  : 'N/A'
                }
              </span>
            </div>
          </div>

          {/* Features Included */}
          <div className="bg-slate-900 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Included Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Complete message timeline with timestamps
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                BIFF scores and pattern detection for each message
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Filtered vs. original content comparison
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                SHA-256 cryptographic hash verification
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Hash chain integrity report
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Professional certification page with signature line
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                "CERTIFIED COURT RECORD" watermark on every page
              </li>
            </ul>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting || messages.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {exporting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Generate Court-Ready PDF
              </>
            )}
          </button>

          {/* Notice */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded text-sm text-blue-300">
            <p className="font-medium mb-2">Legal Notice:</p>
            <p>
              This PDF export is generated with cryptographic verification to ensure authenticity.
              The SHA-256 hash chain proves that messages have not been tampered with since creation.
              This document is suitable for submission as evidence in legal proceedings.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
