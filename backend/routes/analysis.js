const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const openaiService = require('../services/openaiService');

// Transcribe audio from URL
router.post('/transcribe', protect, async (req, res) => {
  try {
    const { audioUrl } = req.body;

    if (!audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'Audio URL is required'
      });
    }

    // For demo purposes, we'll use a sample transcript
    const sampleTranscript = {
      text: "Hello, thank you for calling our customer service. My name is Sarah, how can I help you today? I understand you're having an issue with your recent order. Let me look that up for you. I can see the problem here. Your order was delayed due to a shipping issue. I apologize for the inconvenience. I'll expedite the shipping and you should receive it by tomorrow. Is there anything else I can help you with? Thank you for your patience. Have a great day!",
      segments: [
        {
          start: 0,
          end: 5,
          text: "Hello, thank you for calling our customer service.",
          speaker: "agent"
        },
        {
          start: 5,
          end: 10,
          text: "My name is Sarah, how can I help you today?",
          speaker: "agent"
        }
      ],
      language: "en",
      duration: 45,
      confidence: 0.95
    };

    res.json({
      success: true,
      data: sampleTranscript
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analyze transcript
router.post('/analyze', protect, async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    const analysis = await openaiService.analyzeCall(transcript);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate coaching plan
router.post('/coaching', protect, async (req, res) => {
  try {
    const { analysis, transcript } = req.body;

    if (!analysis || !transcript) {
      return res.status(400).json({
        success: false,
        error: 'Analysis and transcript are required'
      });
    }

    const coachingPlan = await openaiService.generateCoachingPlan(analysis, transcript);

    res.json({
      success: true,
      data: coachingPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cost estimation
router.post('/cost-estimate', protect, async (req, res) => {
  try {
    const { transcriptLength, model } = req.body;

    if (!transcriptLength) {
      return res.status(400).json({
        success: false,
        error: 'Transcript length is required'
      });
    }

    const costEstimate = openaiService.getEstimatedCost(transcriptLength, model);

    res.json({
      success: true,
      data: costEstimate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
