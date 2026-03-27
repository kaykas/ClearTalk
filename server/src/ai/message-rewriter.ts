import Anthropic from '@anthropic-ai/sdk';
import { BiffScores } from './biff-scorer';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export interface RewriteResult {
  rewritten: string;
  improvements: string[];
  newScores: BiffScores;
}

const REWRITE_PROMPT = `You are a BIFF (Brief, Informative, Friendly, Firm) communication expert specializing in co-parenting messages.

Your task is to rewrite messages to improve their BIFF scores while preserving all factual information.

**Rules:**
1. **Brief:** Remove unnecessary details, redundancy, and rambling. Get to the point.
2. **Informative:** Keep ALL facts (dates, times, names, logistics). Remove opinions, blame, and emotional language.
3. **Friendly:** Use respectful, professional tone. Remove passive-aggression, sarcasm, attacks.
4. **Firm:** Make boundaries and expectations crystal clear. Remove defensiveness and vague requests.

**Preserve:**
- All dates, times, locations
- All names and specific details
- The core request or information
- Any legal or safety concerns

**Remove:**
- Personal attacks or criticism
- Emotional language ("You always...", "You never...")
- Defensive explanations
- Unnecessary backstory
- Manipulation attempts

Return ONLY valid JSON (no markdown, no code blocks):
{
  "rewritten": "<improved message>",
  "improvements": [<string>, <string>, ...]
}`;

/**
 * Rewrites a message to improve BIFF scores using Claude Sonnet 4.6
 * Target response time: <2s
 * Cost: ~$0.003 per message
 */
export async function rewriteMessage(
  messageContent: string,
  currentScores: BiffScores
): Promise<RewriteResult> {
  try {
    const userPrompt = `Original message:
"${messageContent}"

Current BIFF scores:
- Brief: ${currentScores.brief}/100
- Informative: ${currentScores.informative}/100
- Friendly: ${currentScores.friendly}/100
- Firm: ${currentScores.firm}/100
- Overall: ${currentScores.overall}/100

Rewrite this message to improve these scores.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: REWRITE_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const result = JSON.parse(content.text) as {
      rewritten: string;
      improvements: string[];
    };

    // Validate response
    if (
      typeof result.rewritten !== 'string' ||
      !Array.isArray(result.improvements)
    ) {
      throw new Error('Invalid rewrite response format');
    }

    // Score the rewritten message to verify improvement
    const { scoreBiffMessage } = await import('./biff-scorer');
    const newScores = await scoreBiffMessage(result.rewritten);

    return {
      rewritten: result.rewritten,
      improvements: result.improvements,
      newScores
    };
  } catch (error) {
    console.error('Message rewrite error:', error);
    throw new Error(`Failed to rewrite message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get rewrite suggestions without actually rewriting
 * (Cheaper, faster for "preview" mode)
 */
export async function getRewriteSuggestions(
  messageContent: string,
  currentScores: BiffScores
): Promise<string[]> {
  const suggestionPrompt = `Analyze this co-parenting message and provide 3-5 specific suggestions for improvement:

Message: "${messageContent}"

Current BIFF scores:
- Brief: ${currentScores.brief}/100
- Informative: ${currentScores.informative}/100
- Friendly: ${currentScores.friendly}/100
- Firm: ${currentScores.firm}/100

Return ONLY a JSON array of suggestion strings (no markdown):
["suggestion 1", "suggestion 2", ...]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514', // Use cheaper model for suggestions
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: suggestionPrompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return JSON.parse(content.text) as string[];
  } catch (error) {
    console.error('Get suggestions error:', error);
    throw new Error(`Failed to get suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
