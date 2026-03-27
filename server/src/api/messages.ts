import { Router } from 'express';
import { supabase } from '../utils/supabase';
import { createMessageHash, verifyHashChain } from '../utils/hash-chain';
import { scoreBiffMessage } from '../ai/biff-scorer';
import { rewriteMessage, getRewriteSuggestions } from '../ai/message-rewriter';
import { shieldMessage } from '../ai/message-shield';

const router = Router();

/**
 * POST /api/messages/score
 * Score a draft message for BIFF compliance
 */
router.post('/score', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const scores = await scoreBiffMessage(content);

    res.json({
      success: true,
      scores
    });
  } catch (error) {
    console.error('Score message error:', error);
    res.status(500).json({
      error: 'Failed to score message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/messages/rewrite
 * Improve a draft message for better BIFF scores
 */
router.post('/rewrite', async (req, res) => {
  try {
    const { content, scores } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // If scores not provided, calculate them first
    const currentScores = scores || await scoreBiffMessage(content);

    const result = await rewriteMessage(content, currentScores);

    res.json({
      success: true,
      original: content,
      rewritten: result.rewritten,
      improvements: result.improvements,
      originalScores: currentScores,
      newScores: result.newScores
    });
  } catch (error) {
    console.error('Rewrite message error:', error);
    res.status(500).json({
      error: 'Failed to rewrite message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/messages/suggestions
 * Get improvement suggestions without rewriting
 */
router.post('/suggestions', async (req, res) => {
  try {
    const { content, scores } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const currentScores = scores || await scoreBiffMessage(content);
    const suggestions = await getRewriteSuggestions(content, currentScores);

    res.json({
      success: true,
      suggestions,
      scores: currentScores
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/messages/send
 * Send a message (with auto-scoring and hash chain)
 */
router.post('/send', async (req, res) => {
  try {
    const {
      conversation_id,
      sender_id,
      recipient_id,
      content
    } = req.body;

    if (!conversation_id || !sender_id || !recipient_id || !content) {
      return res.status(400).json({
        error: 'Missing required fields: conversation_id, sender_id, recipient_id, content'
      });
    }

    // Score the message
    const scores = await scoreBiffMessage(content);

    // Get previous hash from last message in conversation
    const { data: lastMessage, error: lastMsgError } = await supabase
      .from('messages')
      .select('hash')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastMsgError && lastMsgError.code !== 'PGRST116') { // PGRST116 = no rows
      throw lastMsgError;
    }

    const previousHash = lastMessage?.hash || null;

    // Create message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id,
        sender_id,
        recipient_id,
        content,
        biff_score: scores.overall,
        biff_brief: scores.brief,
        biff_informative: scores.informative,
        biff_friendly: scores.friendly,
        biff_firm: scores.firm,
        previous_hash: previousHash,
        is_filtered: false
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Calculate hash
    const hash = createMessageHash(
      message.id,
      message.content,
      message.created_at,
      previousHash
    );

    // Update message with hash
    const { error: updateError } = await supabase
      .from('messages')
      .update({ hash })
      .eq('id', message.id);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: {
        ...message,
        hash
      },
      scores
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/messages/shield
 * Apply message shield to incoming message
 */
router.post('/shield', async (req, res) => {
  try {
    const { content, message_id } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const result = await shieldMessage(content, message_id);

    res.json({
      success: true,
      original: content,
      filtered: result.filtered,
      manipulation_types: result.manipulation_types,
      severity: result.severity,
      facts_preserved: result.facts_preserved,
      originalKept: result.originalKept
    });
  } catch (error) {
    console.error('Shield message error:', error);
    res.status(500).json({
      error: 'Failed to shield message',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/messages/verify/:conversation_id
 * Verify hash chain integrity for a conversation
 */
router.get('/verify/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, content, created_at, hash, previous_hash')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!messages || messages.length === 0) {
      return res.json({
        success: true,
        valid: true,
        message: 'No messages to verify'
      });
    }

    const verification = verifyHashChain(messages);

    res.json({
      success: true,
      ...verification,
      total_messages: messages.length
    });
  } catch (error) {
    console.error('Verify hash chain error:', error);
    res.status(500).json({
      error: 'Failed to verify hash chain',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/messages/conversation/:conversation_id
 * Get all messages in a conversation
 */
router.get('/conversation/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) throw error;

    res.json({
      success: true,
      messages: messages || [],
      count: messages?.length || 0
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      error: 'Failed to get messages',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
