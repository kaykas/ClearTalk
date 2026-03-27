import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

export interface BiffScores {
  brief: number;
  informative: number;
  friendly: number;
  firm: number;
  overall: number;
  suggestions: string[];
}

const BIFF_PROMPT = `You are a BIFF (Brief, Informative, Friendly, Firm) communication analyzer for co-parenting messages.

Analyze this message and score each dimension from 0-100:

**Brief (0-100):** How concise is the message? Penalize unnecessary details, rambling, or redundancy.
- 0-25: Very wordy, unfocused
- 26-50: Some unnecessary details
- 51-75: Mostly concise
- 76-100: Perfectly concise, only essential information

**Informative (0-100):** How factual and objective is the content? Reward facts, dates, times, logistics. Penalize opinions, blame, or emotional language.
- 0-25: Mostly opinions/emotions
- 26-50: Mix of facts and opinions
- 51-75: Mostly factual
- 76-100: Pure facts, dates, times, logistics

**Friendly (0-100):** How respectful and professional is the tone? Penalize passive-aggression, sarcasm, personal attacks.
- 0-25: Hostile or attacking
- 26-50: Cold or passive-aggressive
- 51-75: Neutral to warm
- 76-100: Respectful, professional, warm

**Firm (0-100):** How clear are the boundaries and expectations? Reward clarity about what you will/won't do. Penalize vague requests or defensive explanations.
- 0-25: Vague, defensive, unclear
- 26-50: Some clarity but defensive
- 51-75: Clear with minor ambiguity
- 76-100: Crystal clear boundaries and expectations

Calculate **overall** as the average of all four scores.

Provide 2-4 specific, actionable suggestions for improvement.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "brief": <number>,
  "informative": <number>,
  "friendly": <number>,
  "firm": <number>,
  "overall": <number>,
  "suggestions": [<string>, <string>, ...]
}`;

/**
 * Scores a message for BIFF compliance using Claude Haiku 4.5
 * Target response time: <500ms
 * Cost: ~$0.002 per message
 */
export async function scoreBiffMessage(messageContent: string): Promise<BiffScores> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-20250514',
      max_tokens: 1024,
      system: BIFF_PROMPT,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const scores = JSON.parse(content.text) as BiffScores;

    // Validate scores
    if (
      typeof scores.brief !== 'number' ||
      typeof scores.informative !== 'number' ||
      typeof scores.friendly !== 'number' ||
      typeof scores.firm !== 'number' ||
      !Array.isArray(scores.suggestions)
    ) {
      throw new Error('Invalid BIFF scores format');
    }

    // Calculate overall if not provided
    scores.overall = Math.round(
      (scores.brief + scores.informative + scores.friendly + scores.firm) / 4
    );

    return scores;
  } catch (error) {
    console.error('BIFF scoring error:', error);
    throw new Error(`Failed to score BIFF message: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch score multiple messages (useful for conversation analysis)
 */
export async function scoreBiffBatch(messages: string[]): Promise<BiffScores[]> {
  return Promise.all(messages.map(msg => scoreBiffMessage(msg)));
}
