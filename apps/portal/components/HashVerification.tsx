'use client'

import { useEffect, useState } from 'react'
import { Message } from '@/lib/supabase'
import { verifyMessageChain } from '@/lib/hash-verifier'
import { CheckCircle, XCircle, Loader2, Shield } from 'lucide-react'

interface HashVerificationProps {
  conversationId: string
  messages: Message[]
}

export default function HashVerification({ conversationId, messages }: HashVerificationProps) {
  const [verifying, setVerifying] = useState(true)
  const [result, setResult] = useState<{
    overallValid: boolean
    results: any[]
    tamperedMessages: string[]
  } | null>(null)

  useEffect(() => {
    async function verify() {
      setVerifying(true)
      try {
        const verificationResult = await verifyMessageChain(messages)
        setResult(verificationResult)
      } catch (error) {
        console.error('Verification error:', error)
      } finally {
        setVerifying(false)
      }
    }

    if (messages.length > 0) {
      verify()
    } else {
      setVerifying(false)
    }
  }, [messages])

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-6 w-6 text-blue-500" />
        <h2 className="text-lg font-semibold text-white">Hash Chain Verification</h2>
      </div>

      {verifying ? (
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verifying message integrity...</span>
        </div>
      ) : result ? (
        <div>
          {/* Overall Status */}
          <div className={`flex items-center gap-3 p-4 rounded-lg mb-4 ${
            result.overallValid
              ? 'bg-green-900/20 border border-green-700'
              : 'bg-red-900/20 border border-red-700'
          }`}>
            {result.overallValid ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-400" />
                <div>
                  <p className="text-green-400 font-medium">Hash Chain Verified</p>
                  <p className="text-sm text-green-300 mt-1">
                    All {messages.length} messages have valid cryptographic signatures. No tampering detected.
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">Hash Chain Compromised</p>
                  <p className="text-sm text-red-300 mt-1">
                    {result.tamperedMessages.length} message(s) failed verification. Possible tampering detected.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900 rounded p-3">
              <p className="text-2xl font-bold text-white">{messages.length}</p>
              <p className="text-xs text-gray-400 mt-1">Total Messages</p>
            </div>
            <div className="bg-slate-900 rounded p-3">
              <p className="text-2xl font-bold text-green-400">
                {result.results.filter(r => r.isValid).length}
              </p>
              <p className="text-xs text-gray-400 mt-1">Verified</p>
            </div>
            <div className="bg-slate-900 rounded p-3">
              <p className="text-2xl font-bold text-red-400">{result.tamperedMessages.length}</p>
              <p className="text-xs text-gray-400 mt-1">Failed</p>
            </div>
          </div>

          {/* Tampered Messages Warning */}
          {result.tamperedMessages.length > 0 && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded">
              <p className="text-sm font-medium text-red-300 mb-2">Compromised Message IDs:</p>
              <div className="flex flex-wrap gap-2">
                {result.tamperedMessages.map((msgId) => (
                  <code key={msgId} className="px-2 py-1 bg-red-900 rounded text-xs text-red-200">
                    {msgId}
                  </code>
                ))}
              </div>
            </div>
          )}

          {/* Verification Info */}
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-gray-400">
            <p>
              Verification uses SHA-256 cryptographic hashing to ensure message authenticity.
              Each message contains a hash of its content and the previous message's hash,
              forming an immutable chain.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">No verification results available.</p>
      )}
    </div>
  )
}
