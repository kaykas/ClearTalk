import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatDate, getBIFFScoreColor, getBIFFScoreLabel } from '@/lib/utils'
import MessageTimeline from '@/components/MessageTimeline'
import HashVerification from '@/components/HashVerification'
import BIFFAnalytics from '@/components/BIFFAnalytics'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ConversationPage({ params }: PageProps) {
  const supabase = createServerClient()

  // Get authenticated user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Verify user is an attorney and has access to this conversation
  const { data: access } = await supabase
    .from('professional_access')
    .select('access_level')
    .eq('professional_id', session.user.id)
    .eq('conversation_id', params.id)
    .single()

  if (!access) {
    redirect('/clients')
  }

  // Get conversation details
  const { data: conversation } = await supabase
    .from('conversations')
    .select(`
      id,
      case_number,
      jurisdiction,
      status,
      created_at,
      participant_a:users!conversations_participant_a_id_fkey (
        id,
        full_name,
        email
      ),
      participant_b:users!conversations_participant_b_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('id', params.id)
    .single()

  if (!conversation) {
    redirect('/clients')
  }

  // Get all messages in chronological order
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      recipient_id,
      original_content,
      filtered_content,
      was_filtered,
      biff_score,
      hostile_language_count,
      pattern_flags,
      message_hash,
      previous_hash,
      created_at,
      sender:users!messages_sender_id_fkey (
        id,
        full_name,
        email
      ),
      recipient:users!messages_recipient_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  const messageList = messages || []

  // Calculate statistics
  const avgBIFFScore = messageList.length > 0
    ? messageList.reduce((sum, msg) => sum + msg.biff_score, 0) / messageList.length
    : 0

  const filteredCount = messageList.filter(msg => msg.was_filtered).length
  const patternsDetected = new Set(messageList.flatMap(msg => msg.pattern_flags)).size

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/clients"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {(conversation.participant_a as any)?.full_name} & {(conversation.participant_b as any)?.full_name}
                </h1>
                <p className="text-sm text-gray-400">
                  {conversation.case_number && `Case: ${conversation.case_number}`}
                  {conversation.jurisdiction && ` • ${conversation.jurisdiction}`}
                </p>
              </div>
            </div>
            {access.access_level === 'export' && (
              <Link
                href={`/clients/${params.id}/export`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Export to PDF
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Messages</p>
                <p className="text-2xl font-bold text-white">{messageList.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg BIFF Score</p>
                <p className={`text-2xl font-bold ${getBIFFScoreColor(avgBIFFScore)}`}>
                  {avgBIFFScore.toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">{getBIFFScoreLabel(avgBIFFScore)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Filtered Messages</p>
                <p className="text-2xl font-bold text-yellow-500">{filteredCount}</p>
                <p className="text-xs text-gray-500">
                  {messageList.length > 0 ? `${((filteredCount / messageList.length) * 100).toFixed(1)}%` : '0%'}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Patterns Detected</p>
                <p className="text-2xl font-bold text-orange-500">{patternsDetected}</p>
                <p className="text-xs text-gray-500">Unique patterns</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Hash Verification Status */}
        <div className="mb-8">
          <HashVerification conversationId={params.id} messages={messageList} />
        </div>

        {/* BIFF Analytics Chart */}
        <div className="mb-8">
          <BIFFAnalytics messages={messageList} />
        </div>

        {/* Message Timeline */}
        <div>
          <MessageTimeline messages={messageList} />
        </div>
      </main>
    </div>
  )
}
