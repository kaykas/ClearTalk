import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { detectPatterns, getPatternHistory, getPatternStats } from '../ai/pattern-detector';
import { getShieldStats } from '../ai/message-shield';
import { scoreBiffBatch } from '../ai/biff-scorer';

const router = Router();

/**
 * POST /api/analysis/patterns
 * Detect manipulation patterns in conversation
 */
router.post('/patterns', async (req, res) => {
  try {
    const { conversation_id, message_limit = 10 } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }

    const result = await detectPatterns(conversation_id, message_limit);

    res.json({
      success: true,
      conversation_id,
      ...result
    });
  } catch (error) {
    console.error('Pattern detection error:', error);
    res.status(500).json({
      error: 'Failed to detect patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/patterns/:conversation_id
 * Get pattern detection history
 */
router.get('/patterns/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { limit = 20 } = req.query;

    const patterns = await getPatternHistory(conversation_id, Number(limit));

    res.json({
      success: true,
      conversation_id,
      patterns
    });
  } catch (error) {
    console.error('Get pattern history error:', error);
    res.status(500).json({
      error: 'Failed to get pattern history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/patterns/stats/:conversation_id
 * Get aggregated pattern statistics
 */
router.get('/patterns/stats/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;

    const stats = await getPatternStats(conversation_id);

    res.json({
      success: true,
      conversation_id,
      stats
    });
  } catch (error) {
    console.error('Get pattern stats error:', error);
    res.status(500).json({
      error: 'Failed to get pattern stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/shield/stats/:conversation_id
 * Get message shield statistics
 */
router.get('/shield/stats/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;

    const stats = await getShieldStats(conversation_id);

    res.json({
      success: true,
      conversation_id,
      stats
    });
  } catch (error) {
    console.error('Get shield stats error:', error);
    res.status(500).json({
      error: 'Failed to get shield stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/biff-history/:conversation_id
 * Get BIFF score trends over time
 */
router.get('/biff-history/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { limit = 30 } = req.query;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, created_at, biff_score, biff_brief, biff_informative, biff_friendly, biff_firm, sender_id')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(Number(limit));

    if (error) throw error;

    if (!messages || messages.length === 0) {
      return res.json({
        success: true,
        conversation_id,
        history: [],
        trends: null
      });
    }

    // Calculate trends
    const first10 = messages.slice(0, 10);
    const last10 = messages.slice(-10);

    const calculateAvg = (msgs: typeof messages, field: string) => {
      const sum = msgs.reduce((acc, m) => acc + (m[field as keyof typeof m] as number || 0), 0);
      return Math.round(sum / msgs.length);
    };

    const trends = {
      overall: {
        first: calculateAvg(first10, 'biff_score'),
        last: calculateAvg(last10, 'biff_score'),
        change: calculateAvg(last10, 'biff_score') - calculateAvg(first10, 'biff_score')
      },
      brief: {
        first: calculateAvg(first10, 'biff_brief'),
        last: calculateAvg(last10, 'biff_brief'),
        change: calculateAvg(last10, 'biff_brief') - calculateAvg(first10, 'biff_brief')
      },
      informative: {
        first: calculateAvg(first10, 'biff_informative'),
        last: calculateAvg(last10, 'biff_informative'),
        change: calculateAvg(last10, 'biff_informative') - calculateAvg(first10, 'biff_informative')
      },
      friendly: {
        first: calculateAvg(first10, 'biff_friendly'),
        last: calculateAvg(last10, 'biff_friendly'),
        change: calculateAvg(last10, 'biff_friendly') - calculateAvg(first10, 'biff_friendly')
      },
      firm: {
        first: calculateAvg(first10, 'biff_firm'),
        last: calculateAvg(last10, 'biff_firm'),
        change: calculateAvg(last10, 'biff_firm') - calculateAvg(first10, 'biff_firm')
      }
    };

    res.json({
      success: true,
      conversation_id,
      history: messages,
      trends
    });
  } catch (error) {
    console.error('Get BIFF history error:', error);
    res.status(500).json({
      error: 'Failed to get BIFF history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/analysis/dashboard/:conversation_id
 * Comprehensive dashboard with all analytics
 */
router.get('/dashboard/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;

    // Fetch all analytics in parallel
    const [
      patternStats,
      shieldStats,
      biffHistory
    ] = await Promise.all([
      getPatternStats(conversation_id).catch(() => null),
      getShieldStats(conversation_id).catch(() => null),
      supabase
        .from('messages')
        .select('biff_score, created_at')
        .eq('conversation_id', conversation_id)
        .order('created_at', { ascending: true })
        .limit(30)
        .then(r => r.data || [])
    ]);

    // Calculate overall BIFF average
    const avgBiff = biffHistory.length > 0
      ? Math.round(biffHistory.reduce((sum, m) => sum + m.biff_score, 0) / biffHistory.length)
      : 0;

    res.json({
      success: true,
      conversation_id,
      dashboard: {
        biff: {
          average: avgBiff,
          recent_messages: biffHistory.length,
          trend: biffHistory.length >= 20
            ? (biffHistory.slice(-10).reduce((s, m) => s + m.biff_score, 0) / 10) -
              (biffHistory.slice(0, 10).reduce((s, m) => s + m.biff_score, 0) / 10)
            : 0
        },
        patterns: patternStats,
        shield: shieldStats
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/analysis/batch-score
 * Batch score multiple messages
 */
router.post('/batch-score', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    if (messages.length > 20) {
      return res.status(400).json({ error: 'Maximum 20 messages per batch' });
    }

    const scores = await scoreBiffBatch(messages);

    res.json({
      success: true,
      results: messages.map((content, idx) => ({
        content,
        scores: scores[idx]
      }))
    });
  } catch (error) {
    console.error('Batch score error:', error);
    res.status(500).json({
      error: 'Failed to batch score messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
