const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY!;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

export interface BIFFScore {
  brief: number;
  informative: number;
  friendly: number;
  firm: number;
  overall: number;
  suggestions: string[];
}

export interface ClaudeResponse {
  biff_score: BIFFScore;
  coaching_message: string;
  improved_version?: string;
}

/**
 * Analyze a message for BIFF compliance using Claude API
 */
export async function analyzeBIFFScore(message: string): Promise<ClaudeResponse> {
  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this message for BIFF compliance (Brief, Informative, Friendly, Firm).

BIFF Criteria:
- Brief: Concise, no unnecessary details (0-100 score)
- Informative: Clear facts without emotion (0-100 score)
- Friendly: Respectful tone without being overly casual (0-100 score)
- Firm: Clear boundaries without aggression (0-100 score)

Message to analyze:
"${message}"

Respond ONLY with valid JSON in this exact format:
{
  "biff_score": {
    "brief": <0-100>,
    "informative": <0-100>,
    "friendly": <0-100>,
    "firm": <0-100>,
    "overall": <average of four scores>,
    "suggestions": ["suggestion 1", "suggestion 2"]
  },
  "coaching_message": "Brief explanation of scores",
  "improved_version": "Optional improved version of the message"
}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse the JSON response from Claude
    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error('Error analyzing BIFF score:', error);

    // Return default scores on error
    return {
      biff_score: {
        brief: 50,
        informative: 50,
        friendly: 50,
        firm: 50,
        overall: 50,
        suggestions: ['Unable to analyze message. Please try again.'],
      },
      coaching_message: 'Error analyzing message. Please check your connection.',
    };
  }
}

/**
 * Get real-time BIFF coaching as user types
 * Debounced to avoid excessive API calls
 */
let debounceTimer: NodeJS.Timeout | null = null;

export function getBIFFCoachingDebounced(
  message: string,
  callback: (response: ClaudeResponse) => void,
  delay: number = 1000
): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (!message.trim()) {
    callback({
      biff_score: {
        brief: 0,
        informative: 0,
        friendly: 0,
        firm: 0,
        overall: 0,
        suggestions: [],
      },
      coaching_message: 'Start typing to get BIFF coaching...',
    });
    return;
  }

  debounceTimer = setTimeout(async () => {
    const response = await analyzeBIFFScore(message);
    callback(response);
  }, delay);
}
