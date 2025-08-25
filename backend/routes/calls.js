const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadCall,
  getCalls,
  getCall,
  getCallAnalysis,
  getCoachingPlan,
  deleteCall,
  updateCall,
  getCallStats,
  getCallHistory,
  getCallAnalytics,
  getCallProcessingHistory
} = require('../controllers/callController');
const upload = require('../middleware/upload');

// Upload call
router.post('/upload', protect, upload.single('audio'), uploadCall);

// Get all calls
router.get('/', protect, getCalls);

// Get call history with filters
router.get('/history', protect, getCallHistory);

// Get call analytics
router.get('/analytics', protect, getCallAnalytics);

// Get call statistics
router.get('/stats', protect, getCallStats);

// Get single call
router.get('/:id', protect, getCall);

// Get call analysis
router.get('/:id/analysis', protect, getCallAnalysis);

// Get coaching plan
router.get('/:id/coaching', protect, getCoachingPlan);

// Get call processing history
router.get('/:id/processing-history', protect, getCallProcessingHistory);

// Update call
router.put('/:id', protect, updateCall);

// Delete call
router.delete('/:id', protect, deleteCall);

module.exports = router;
