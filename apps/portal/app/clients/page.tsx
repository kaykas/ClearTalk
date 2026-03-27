import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, Users, Clock, Shield } from 'lucide-react'
import { formatDateShort } from '@/lib/utils'

export default async function ClientsPage() {
  const supabase = createServerClient()

  // Get authenticated user
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login')
  }

  // Verify user is an attorney
  const { data: user } = await supabase
    .from('users')
    .select('role, full_name, email')
    .eq('id', session.user.id)
    .single()

  if (!user || user.role !== 'attorney') {
    redirect('/login')
  }

  // Get all conversations this attorney has access to
  const { data: accessGrants } = await supabase
    .from('professional_access')
    .select(`
      id,
      access_level,
      granted_at,
      conversation:conversations (
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
      )
    `)
    .eq('professional_id', session.user.id)
    .order('granted_at', { ascending: false })

  // Get message counts for each conversation
  const conversationIds = accessGrants?.map(grant => (grant.conversation as any)?.id).filter(Boolean) || []

  const messageCounts: Record<string, number> = {}
  const lastMessageDates: Record<string, string> = {}

  if (conversationIds.length > 0) {
    for (const convId of conversationIds) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convId)

      messageCounts[convId] = count || 0

      const { data: lastMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastMessage) {
        lastMessageDates[convId] = lastMessage.created_at
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-500" />
                ClearTalk Professional Portal
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                Logged in as {user.full_name} ({user.email})
              </p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Client Conversations</h2>
          <p className="mt-1 text-sm text-gray-400">
            Access conversations you have been granted permission to view
          </p>
        </div>

        {!accessGrants || accessGrants.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-12 text-center">
            <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Clients Yet</h3>
            <p className="text-gray-400">
              You don't have access to any conversations yet. Contact your clients to grant you access.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accessGrants.map((grant) => {
              const conversation = grant.conversation as any
              if (!conversation) return null

              const participantA = conversation.participant_a
              const participantB = conversation.participant_b
              const messageCount = messageCounts[conversation.id] || 0
              const lastMessageDate = lastMessageDates[conversation.id]

              return (
                <Link
                  key={grant.id}
                  href={`/clients/${conversation.id}`}
                  className="block bg-slate-800 rounded-lg border border-slate-700 hover:border-blue-500 transition-all p-6 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {participantA?.full_name || 'Unknown'} & {participantB?.full_name || 'Unknown'}
                      </h3>
                      {conversation.case_number && (
                        <p className="text-sm text-gray-400 mt-1">
                          Case: {conversation.case_number}
                        </p>
                      )}
                      {conversation.jurisdiction && (
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.jurisdiction}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      conversation.status === 'active'
                        ? 'bg-green-900/50 text-green-300'
                        : conversation.status === 'suspended'
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {conversation.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span>{messageCount} messages</span>
                    </div>
                    {lastMessageDate && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>Last activity: {formatDateShort(lastMessageDate)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="h-4 w-4" />
                      <span className="capitalize">{grant.access_level.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <span className="text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                      View Conversation →
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
