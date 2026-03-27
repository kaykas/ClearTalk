import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../utils/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export interface PatternDetection {
  type: string;
  confidence: number;
  evidence: string;
  detected_in_messages: string[];
}

export interface PatternAnalysisResult {
  patterns: PatternDetection[];
  summary: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
}

const PATTERN_PROMPT = `You are an expert in detecting manipulation patterns in co-parenting communications. Analyze conversation history for these patterns:

**1. DARVO (Deny, Attack, Reverse Victim/Offender)**
- Denies wrongdoing or issue
- Attacks the person raising concern
- Claims to be the real victim
- Example: "I didn't do that. You're always attacking me. I'm the one being hurt here."

**2. Gaslighting**
- Denies agreed-upon facts or events
- Makes the other person question their memory/perception
- Rewrites history
- Example: "That never happened. You're imagining things."

**3. Manufactured Urgency**
- Creates false emergencies to pressure immediate response
- Uses "emergency" language for non-urgent matters
- Pattern of last-minute changes framed as urgent
- Example: "URGENT: Need to change pickup RIGHT NOW" (for non-emergency)

**4. Boundary Testing**
- Repeatedly pushes against established agreements
- Small violations that escalate over time
- Tests consequences by breaking rules
- Example: Consistently late for exchanges, ignoring custody schedule

**5. Information Control**
- Withholds important information as punishment
- Shares critical info at last minute
- Uses information as leverage
- Example: "I'll tell you about the doctor appointment when you..."

**6. Triangulation**
- Uses children as messengers
- Makes children choose sides
- Shares adult conflicts with children
- Example: "Tell your dad he needs to..." or "Your mom doesn't care about..."

**7. Guilt-Tripping**
- Uses emotional manipulation to create obligation
- Weaponizes children's feelings
- Creates shame or fear
- Example: "The kids will be so disappointed if you don't..."

**8. Passive-Aggressive Communication**
- Indirect hostility
- Sarcasm disguised as concern
- Backhanded compliments
- Example: "I'm sure you're doing your best, even if..."

Analyze the conversation for these patterns. Look for:
- Frequency (pattern appears multiple times)
- Escalation (pattern intensifies over time)
- Consistency (pattern used regularly)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "patterns": [
    {
      "type": "<pattern name>",
      "confidence": <0-100>,
      "evidence": "<specific example or description>",
      "detected_in_messages": [<array of message indices where pattern appears>]
    }
  ],
  "summary": "<brief overview of findings>",
  "risk_level": "low" | "medium" | "high" | "critical"
}`;

/**
 * Detects manipulation patterns in conversation history
 * Target response time: <3s
 * Cost: ~$0.005 per analysis
 */
export async function detectPatterns(
  conversationId: string,
  messageLimit: number = 10
): Promise<PatternAnalysisResult> {
  try {
    // Fetch recent messages from conversation
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(messageLimit);

    if (msgError) throw msgError;

    if (!messages || messages.length === 0) {
      return {
        patterns: [],
        summary: 'No messages to analyze',
        risk_level: 'low'
      };
    }

    // Format messages for analysis
    const messageHistory = messages
      .reverse()
      .map((msg, idx) => `[Message ${idx + 1}] ${msg.content}`)
      .join('\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3072,
      system: PATTERN_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze this conversation history for manipulation patterns:\n\n${messageHistory}`
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const result = JSON.parse(content.text) as PatternAnalysisResult;

    // Validate response
    if (
      !Array.isArray(result.patterns) ||
      typeof result.summary !== 'string' ||
      !['low', 'medium', 'high', 'critical'].includes(result.risk_level)
    ) {
      throw new Error('Invalid pattern detection response format');
    }

    // Store detections in database
    for (const pattern of result.patterns) {
      // Map message indices to actual message IDs
      const detectedMessageIds = pattern.detected_in_messages
        .map(idx => {
          const msgIndex = parseInt(idx) - 1; // Convert to 0-indexed
          return messages[msgIndex]?.id;
        })
        .filter(Boolean);

      await supabase.from('pattern_detections').insert({
        conversation_id: conversationId,
        pattern_type: pattern.type,
        confidence: pattern.confidence,
        evidence: pattern.evidence,
        detected_in_messages: detectedMessageIds
      });
    }

    return result;
  } catch (error) {
    console.error('Pattern detection error:', error);
    throw new Error(`Failed to detect patterns: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get pattern detection history for a conversation
 */
export async function getPatternHistory(
  conversationId: string,
  limit: number = 20
): Promise<PatternDetection[]> {
  try {
    const { data, error } = await supabase
      .from('pattern_detections')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Get pattern history error:', error);
    throw new Error(`Failed to get pattern history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get aggregated pattern statistics for a conversation
 */
export async function getPatternStats(conversationId: string): Promise<{
  total_detections: number;
  by_type: Array<{ type: string; count: number; avg_confidence: number }>;
  risk_trend: 'increasing' | 'stable' | 'decreasing';
}> {
  try {
    const { data: detections, error } = await supabase
      .from('pattern_detections')
      .select('pattern_type, confidence, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!detections || detections.length === 0) {
      return {
        total_detections: 0,
        by_type: [],
        risk_trend: 'stable'
      };
    }

    // Group by pattern type
    const typeMap = new Map<string, { count: number; total_confidence: number }>();

    detections.forEach(d => {
      const existing = typeMap.get(d.pattern_type) || { count: 0, total_confidence: 0 };
      typeMap.set(d.pattern_type, {
        count: existing.count + 1,
        total_confidence: existing.total_confidence + d.confidence
      });
    });

    const by_type = Array.from(typeMap.entries())
      .map(([type, data]) => ({
        type,
        count: data.count,
        avg_confidence: Math.round(data.total_confidence / data.count)
      }))
      .sort((a, b) => b.count - a.count);

    // Determine risk trend (compare first half vs second half)
    const midpoint = Math.floor(detections.length / 2);
    const firstHalf = detections.slice(0, midpoint);
    const secondHalf = detections.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.confidence, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.confidence, 0) / secondHalf.length;

    let risk_trend: 'increasing' | 'stable' | 'decreasing';
    if (secondAvg > firstAvg + 10) {
      risk_trend = 'increasing';
    } else if (secondAvg < firstAvg - 10) {
      risk_trend = 'decreasing';
    } else {
      risk_trend = 'stable';
    }

    return {
      total_detections: detections.length,
      by_type,
      risk_trend
    };
  } catch (error) {
    console.error('Get pattern stats error:', error);
    throw new Error(`Failed to get pattern stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
