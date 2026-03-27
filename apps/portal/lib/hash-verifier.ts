import { Message } from './supabase'

/**
 * Verify the hash chain integrity for a sequence of messages
 * Each message's hash should match sha256(previous_hash + message_content)
 */
export interface HashVerificationResult {
  isValid: boolean
  messageId: string
  expectedHash: string
  actualHash: string
  errorMessage?: string
}

/**
 * Compute SHA-256 hash of a string (browser-compatible)
 */
export async function computeSHA256(input: string): Promise<string> {
  // Use Web Crypto API for browser compatibility
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify a single message's hash
 */
export async function verifyMessageHash(
  message: Message,
  previousHash: string | null
): Promise<HashVerificationResult> {
  try {
    // Compute expected hash: SHA-256(previous_hash + message_content)
    const input = (previousHash || '') + message.original_content
    const expectedHash = await computeSHA256(input)

    const isValid = expectedHash === message.message_hash

    return {
      isValid,
      messageId: message.id,
      expectedHash,
      actualHash: message.message_hash,
      errorMessage: isValid ? undefined : 'Hash mismatch detected - possible tampering'
    }
  } catch (error) {
    return {
      isValid: false,
      messageId: message.id,
      expectedHash: '',
      actualHash: message.message_hash,
      errorMessage: `Hash verification error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Verify the entire message chain
 */
export async function verifyMessageChain(
  messages: Message[]
): Promise<{
  overallValid: boolean
  results: HashVerificationResult[]
  tamperedMessages: string[]
}> {
  const results: HashVerificationResult[] = []
  const tamperedMessages: string[] = []

  // Sort messages by created_at to ensure chronological order
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  for (let i = 0; i < sortedMessages.length; i++) {
    const message = sortedMessages[i]
    const previousHash = i === 0 ? null : sortedMessages[i - 1].message_hash

    const result = await verifyMessageHash(message, previousHash)
    results.push(result)

    if (!result.isValid) {
      tamperedMessages.push(message.id)
    }

    // Verify that the message's previous_hash matches the actual previous message's hash
    if (i > 0 && message.previous_hash !== sortedMessages[i - 1].message_hash) {
      tamperedMessages.push(message.id)
      results[i].errorMessage = 'Previous hash pointer mismatch'
    }
  }

  return {
    overallValid: tamperedMessages.length === 0,
    results,
    tamperedMessages
  }
}

/**
 * Generate a verification report for PDF export
 */
export function generateVerificationReport(
  verificationResults: { overallValid: boolean; results: HashVerificationResult[]; tamperedMessages: string[] }
): string {
  const { overallValid, results, tamperedMessages } = verificationResults

  let report = '=== HASH CHAIN VERIFICATION REPORT ===\n\n'
  report += `Overall Status: ${overallValid ? 'VALID ✓' : 'INVALID ✗'}\n`
  report += `Total Messages: ${results.length}\n`
  report += `Verified Messages: ${results.filter(r => r.isValid).length}\n`
  report += `Tampered Messages: ${tamperedMessages.length}\n\n`

  if (!overallValid) {
    report += 'WARNING: Hash chain integrity compromised!\n'
    report += `Tampered Message IDs: ${tamperedMessages.join(', ')}\n\n`
  }

  report += 'Verification performed using SHA-256 cryptographic hashing.\n'
  report += `Verification Date: ${new Date().toISOString()}\n`

  return report
}

/**
 * Compute document hash for PDF certification
 */
export async function computeDocumentHash(content: string): Promise<string> {
  return await computeSHA256(content)
}
