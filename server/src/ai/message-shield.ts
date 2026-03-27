import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../utils/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export interface ShieldResult {
  filtered: string;
  manipulation_types: string[];
  severity: 'low' | 'medium' | 'high';
  facts_preserved: string[];
  originalKept: boolean; // If true, no filtering needed
}

const SHIELD_PROMPT = `You are a protective communication filter for co-parenting messages. Your job is to neutralize hostile, manipulative, or emotionally harmful content while preserving factual information.

**Detect and remove:**
1. **Personal attacks:** Criticism of character, parenting ability, or personal choices
2. **Guilt-tripping:** "The kids will be disappointed...", "You never care about..."
3. **Gaslighting:** Denial of agreed-upon facts, rewriting history
4. **DARVO:** Deny, Attack, Reverse Victim/Offender
5. **Manufactured urgency:** False emergencies to create pressure
6. **Boundary testing:** Pushing limits on agreed arrangements
7. **Information control:** Withholding information as punishment
8. **Triangulation:** Using children as messengers or leverage

**Preserve:**
- Dates, times, locations
- Logistics (pickup, dropoff, schedules)
- Child-related information (health, school, activities)
- Direct questions or requests
- Safety concerns

**If the message contains ONLY facts and logistics with no manipulation, return it unchanged with "originalKept": true.**

**If manipulation is detected, rewrite to extract only facts.**

Return ONLY valid JSON (no markdown, no code blocks):
{
  "filtered": "<neutralized message or original if clean>",
  "manipulation_types": [<detected patterns as strings>],
  "severity": "low" | "medium" | "high",
  "facts_preserved": [<list of key facts extracted>],
  "originalKept": true | false
}`;

/**
 * Applies message shield to filter hostile/manipulative content
 * Target response time: <2s
 * Cost: ~$0.003 per message
 */
export async function shieldMessage(
  messageContent: string,
  messageId?: string
): Promise<ShieldResult> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SHIELD_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze and filter this co-parenting message:\n\n"${messageContent}"`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const result = JSON.parse(content.text) as ShieldResult;

    // Validate response
    if (
      typeof result.filtered !== 'string' ||
      !Array.isArray(result.manipulation_types) ||
      !['low', 'medium', 'high'].includes(result.severity) ||
      !Array.isArray(result.facts_preserved) ||
      typeof result.originalKept !== 'boolean'
    ) {
      throw new Error('Invalid shield response format');
    }

    // Log to database if manipulation was detected and messageId provided
    if (!result.originalKept && messageId && result.manipulation_types.length > 0) {
      await supabase.from('message_shield_logs').insert({
        message_id: messageId,
        original_content: messageContent,
        filtered_content: result.filtered,
        manipulation_types: result.manipulation_types,
        severity: result.severity,
        facts_preserved: result.facts_preserved
      });
    }

    return result;
  } catch (error) {
    console.error('Message shield error:', error);
    throw new Error(`Failed to shield message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch shield multiple messages (useful for conversation import)
 */
export async function shieldBatch(messages: Array<{
  id: string;
  content: string;
}>): Promise<Array<ShieldResult & { messageId: string }>> {
  const results = await Promise.all(
    messages.map(async (msg) => {
      const result = await shieldMessage(msg.content, msg.id);
      return { ...result, messageId: msg.id };
    })
  );

  return results;
}

/**
 * Get shield statistics for a conversation
 */
export async function getShieldStats(conversationId: string): Promise<{
  total_filtered: number;
  by_severity: { low: number; medium: number; high: number };
  common_patterns: Array<{ type: string; count: number }>;
}> {
  try {
    // Get all messages in conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('is_filtered', true);

    if (msgError) throw msgError;

    if (!messages || messages.length === 0) {
      return {
        total_filtered: 0,
        by_severity: { low: 0, medium: 0, high: 0 },
        common_patterns: []
      };
    }

    // Get shield logs for these messages
    const { data: logs, error: logsError } = await supabase
      .from('message_shield_logs')
      .select('*')
      .in('message_id', messages.map(m => m.id));

    if (logsError) throw logsError;

    // Calculate stats
    const stats = {
      total_filtered: logs?.length || 0,
      by_severity: { low: 0, medium: 0, high: 0 },
      common_patterns: [] as Array<{ type: string; count: number }>
    };

    const patternCounts = new Map<string, number>();

    logs?.forEach(log => {
      stats.by_severity[log.severity]++;
      log.manipulation_types.forEach((type: string) => {
        patternCounts.set(type, (patternCounts.get(type) || 0) + 1);
      });
    });

    stats.common_patterns = Array.from(patternCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return stats;
  } catch (error) {
    console.error('Get shield stats error:', error);
    throw new Error(`Failed to get shield stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
