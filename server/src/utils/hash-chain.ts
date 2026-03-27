import { createHash } from 'crypto';

/**
 * Creates a SHA-256 hash for message integrity verification
 * Hash chain: hash(message_id + content + timestamp + previous_hash)
 */
export function createMessageHash(
  messageId: string,
  content: string,
  timestamp: string,
  previousHash: string | null
): string {
  const data = `${messageId}${content}${timestamp}${previousHash || ''}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Verifies message integrity by recalculating hash
 */
export function verifyMessageHash(
  messageId: string,
  content: string,
  timestamp: string,
  previousHash: string | null,
  storedHash: string
): boolean {
  const calculatedHash = createMessageHash(messageId, content, timestamp, previousHash);
  return calculatedHash === storedHash;
}

/**
 * Verifies hash chain integrity for a sequence of messages
 */
export function verifyHashChain(messages: Array<{
  id: string;
  content: string;
  created_at: string;
  hash: string;
  previous_hash: string | null;
}>): {
  valid: boolean;
  brokenAt?: number;
  error?: string;
} {
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isValid = verifyMessageHash(
      msg.id,
      msg.content,
      msg.created_at,
      msg.previous_hash,
      msg.hash
    );

    if (!isValid) {
      return {
        valid: false,
        brokenAt: i,
        error: `Hash verification failed at message ${msg.id}`
      };
    }

    // Check that previous_hash matches the previous message's hash
    if (i > 0 && msg.previous_hash !== messages[i - 1].hash) {
      return {
        valid: false,
        brokenAt: i,
        error: `Hash chain broken: message ${msg.id} previous_hash doesn't match previous message`
      };
    }
  }

  return { valid: true };
}
