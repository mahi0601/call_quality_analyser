const Call = require('../models/Call');
const openaiService = require('../services/openaiService');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Upload call audio file
 * @route   POST /api/calls/upload
 * @access  Private
 */
const uploadCall = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file uploaded'
      });
    }

    // Create call record
    const call = await Call.create({
      user: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Start processing pipeline
    processCallAsync(call._id);

    res.status(201).json({
      success: true,
      data: {
        callId: call._id.toString(),
        message: 'Call uploaded successfully. Processing started.',
        status: call.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all calls for user
 * @route   GET /api/calls
 * @access  Private
 */
const getCalls = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const calls = await Call.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('user', 'name email');

    const total = await Call.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      data: calls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get single call
 * @route   GET /api/calls/:id
 * @access  Private
 */
const getCall = async (req, res) => {
  try {
    console.log('🔍 Getting call with ID:', req.params.id);
    console.log('🔍 User requesting:', req.user.id, req.user.role);
    
    const call = await Call.findById(req.params.id)
      .populate('user', 'name email role department');

    console.log('🔍 Call found:', call ? 'Yes' : 'No');
    if (call) {
      console.log('🔍 Call status:', call.status);
      console.log('🔍 Call user:', call.user?._id?.toString());
    }

    if (!call) {
      console.log('❌ Call not found');
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Check if user owns this call or is admin/supervisor
    if (call.user._id.toString() !== req.user.id && 
        !['admin', 'supervisor'].includes(req.user.role)) {
      console.log('❌ Unauthorized access attempt');
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this call'
      });
    }

    console.log('✅ Sending call data to client');
    res.json({
      success: true,
      data: call
    });
  } catch (error) {
    console.error('❌ Error in getCall:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get call analysis
 * @route   GET /api/calls/:id/analysis
 * @access  Private
 */
const getCallAnalysis = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Check if user owns this call or is admin/supervisor
    if (call.user.toString() !== req.user.id && 
        !['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this call'
      });
    }

    if (call.status !== 'analyzed') {
      return res.status(400).json({
        success: false,
        error: 'Call analysis not completed yet',
        status: call.status
      });
    }

    res.json({
      success: true,
      data: {
        analysis: call.analysis,
        transcript: call.transcript,
        status: call.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get coaching plan
 * @route   GET /api/calls/:id/coaching
 * @access  Private
 */
const getCoachingPlan = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Check if user owns this call or is admin/supervisor
    if (call.user.toString() !== req.user.id && 
        !['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this call'
      });
    }

    if (!call.coachingPlan.generated) {
      return res.status(400).json({
        success: false,
        error: 'Coaching plan not generated yet',
        status: call.status
      });
    }

    // Parse JSON strings back to objects for frontend consumption
    const parsedCoachingPlan = {
      ...call.coachingPlan,
      recommendations: call.coachingPlan.recommendations ? JSON.parse(call.coachingPlan.recommendations) : [],
      resources: call.coachingPlan.resources ? JSON.parse(call.coachingPlan.resources) : [],
      quiz: call.coachingPlan.quiz ? JSON.parse(call.coachingPlan.quiz) : []
    };

    res.json({
      success: true,
      data: {
        coachingPlan: parsedCoachingPlan,
        analysis: call.analysis,
        status: call.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete call
 * @route   DELETE /api/calls/:id
 * @access  Private
 */
const deleteCall = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Check if user owns this call or is admin
    if (call.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this call'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(call.filePath)) {
      fs.unlinkSync(call.filePath);
    }

    await Call.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Call deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update call metadata
 * @route   PUT /api/calls/:id
 * @access  Private
 */
const updateCall = async (req, res) => {
  try {
    const { customerId, callType, tags, notes } = req.body;

    const call = await Call.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Check if user owns this call or is admin/supervisor
    if (call.user.toString() !== req.user.id && 
        !['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this call'
      });
    }

    call.metadata = {
      customerId: customerId || call.metadata.customerId,
      callType: callType || call.metadata.callType,
      tags: tags || call.metadata.tags,
      notes: notes || call.metadata.notes
    };

    const updatedCall = await call.save();

    res.json({
      success: true,
      data: updatedCall
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get call statistics
 * @route   GET /api/calls/stats
 * @access  Private
 */
const getCallStats = async (req, res) => {
  try {
    const stats = await Call.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          avgScore: { $avg: '$analysis.overallScore' },
          totalDuration: { $sum: '$duration' },
          statusCounts: {
            $push: '$status'
          }
        }
      }
    ]);

    const statusBreakdown = await Call.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const scoreDistribution = await Call.aggregate([
      { $match: { user: req.user._id, 'analysis.overallScore': { $exists: true } } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$analysis.overallScore', 60] }, then: 'Poor' },
                { case: { $lt: ['$analysis.overallScore', 80] }, then: 'Fair' },
                { case: { $lt: ['$analysis.overallScore', 90] }, then: 'Good' }
              ],
              default: 'Excellent'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalCalls: 0,
          avgScore: 0,
          totalDuration: 0
        },
        statusBreakdown,
        scoreDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Async function to process call (transcription -> analysis -> coaching)
 */
const processCallAsync = async (callId) => {
  const startTime = Date.now();
  
  try {
    const call = await Call.findById(callId);
    if (!call) {
      console.error('❌ Call not found:', callId);
      return;
    }

    console.log(`🚀 Processing call: ${call.originalName}`);

    // Add initial processing step
    await call.addProcessingStep('upload', 'completed', 'File uploaded successfully', Date.now() - startTime);

    // Emit initial status
    if (global.io) {
      global.io.to(`call-${callId}`).emit('call-status-update', {
        callId,
        status: 'uploaded',
        message: 'Call uploaded successfully'
      });
    }

    // Step 1: Transcribe
    const transcriptionStartTime = Date.now();
    call.status = 'transcribing';
    await call.save();
    await call.addProcessingStep('transcribe', 'started', 'Starting transcription', 0);
    console.log('📝 Step 1/3: Transcribing...');

    // Emit transcription status
    if (global.io) {
      global.io.to(`call-${callId}`).emit('call-status-update', {
        callId,
        status: 'transcribing',
        message: 'Transcribing audio...',
        progress: 33
      });
    }

    const transcription = await openaiService.transcribeAudio(call.filePath);
    const transcriptionTime = Date.now() - transcriptionStartTime;
    
    call.transcript = transcription;
    call.duration = transcription.duration || 0;
    call.status = 'transcribed';
    call.performance.transcriptionTime = transcriptionTime;
    await call.save();
    await call.addProcessingStep('transcribe', 'completed', 'Transcription completed successfully', transcriptionTime);

    // Emit transcription completed
    if (global.io) {
      global.io.to(`call-${callId}`).emit('call-status-update', {
        callId,
        status: 'transcribed',
        message: 'Transcription completed',
        progress: 66,
        transcript: transcription.text
      });
    }

    // Step 2: Analyze
    const analysisStartTime = Date.now();
    call.status = 'analyzing';
    await call.save();
    await call.addProcessingStep('analyze', 'started', 'Starting analysis', 0);
    console.log('🔍 Step 2/3: Analyzing...');

    // Emit analysis status
    if (global.io) {
      global.io.to(`call-${callId}`).emit('call-status-update', {
        callId,
        status: 'analyzing',
        message: 'Analyzing call...',
        progress: 80
      });
    }

    const analysis = await openaiService.analyzeCall(transcription.text);
    const analysisTime = Date.now() - analysisStartTime;
    
    call.analysis = analysis;
    call.status = 'analyzed';
    call.performance.analysisTime = analysisTime;
    await call.save();
    await call.addProcessingStep('analyze', 'completed', 'Analysis completed successfully', analysisTime);

    // Emit analysis completed
    if (global.io) {
      global.io.to(`call-${callId}`).emit('call-status-update', {
        callId,
        status: 'analyzed',
        message: 'Analysis completed',
        progress: 90,
        analysis: analysis
      });
    }

    // Step 3: Generate coaching plan
    const coachingStartTime = Date.now();
    console.log('📚 Step 3/3: Generating coaching plan...');
    await call.addProcessingStep('coaching', 'started', 'Starting coaching plan generation', 0);
    
    // Emit coaching plan status
    if (global.io) {
      global.io.to(`call-${callId}`).emit('call-status-update', {
        callId,
        status: 'generating-coaching',
        message: 'Generating coaching plan...',
        progress: 95
      });
    }

    const coachingPlan = await openaiService.generateCoachingPlan(analysis, transcription.text);
    const coachingTime = Date.now() - coachingStartTime;
    
    // Debug: Log the coaching plan structure
    console.log('🔍 Coaching plan structure check:');
    console.log('- resources type:', typeof coachingPlan.resources);
    console.log('- resources is array:', Array.isArray(coachingPlan.resources));
    console.log('- recommendations type:', typeof coachingPlan.recommendations);
    console.log('- recommendations is array:', Array.isArray(coachingPlan.recommendations));
    
    // Debug: Log the exact structure before saving
    console.log('🔍 Final coaching plan structure:');
    console.log('- resources length:', coachingPlan.resources.length);
    console.log('- first resource:', coachingPlan.resources[0]);
    console.log('- resources type check:', Array.isArray(coachingPlan.resources));
    
    // Convert complex arrays to JSON strings to avoid MongoDB casting issues
    const simplifiedCoachingPlan = {
      generated: true,
      feedback: coachingPlan.feedback,
      recommendations: JSON.stringify(coachingPlan.recommendations),
      resources: JSON.stringify(coachingPlan.resources),
      quiz: JSON.stringify(coachingPlan.quiz),
      completionCriteria: coachingPlan.completionCriteria
    };
    
    // Try saving coaching plan as a separate operation
    const updateResult = await Call.updateOne(
      { _id: callId },
      { 
        $set: {
          'coachingPlan.generated': simplifiedCoachingPlan.generated,
          'coachingPlan.feedback': simplifiedCoachingPlan.feedback,
          'coachingPlan.recommendations': simplifiedCoachingPlan.recommendations,
          'coachingPlan.resources': simplifiedCoachingPlan.resources,
          'coachingPlan.quiz': simplifiedCoachingPlan.quiz,
          'coachingPlan.completionCriteria': simplifiedCoachingPlan.completionCriteria
        }
      }
    );
    
    console.log('✅ Coaching plan saved successfully');
    await call.addProcessingStep('coaching', 'completed', 'Coaching plan generated successfully', coachingTime);

    // Update final status and performance metrics
    const totalProcessingTime = Date.now() - startTime;
    await Call.updateOne(
      { _id: callId },
      {
        $set: {
          status: 'completed',
          'performance.processingTime': totalProcessingTime,
          'performance.coachingTime': coachingTime
        }
      }
    );

    // Emit final completion status
    if (global.io) {
      global.io.to(`call-${callId}`).emit('call-status-update', {
        callId,
        status: 'completed',
        message: 'Call processing completed successfully',
        progress: 100,
        coachingPlan: coachingPlan
      });
    }

    console.log(`✅ Call processing completed: ${call.originalName} (${totalProcessingTime}ms)`);
  } catch (error) {
    console.error(`❌ Call processing failed: ${callId}`, error.message);
    
    // Add error to processing history
    const call = await Call.findById(callId);
    if (call) {
      await call.addProcessingStep('error', 'failed', error.message, 0, error);
      call.status = 'error';
      call.error = {
        message: error.message,
        code: error.code || 'PROCESSING_ERROR',
        timestamp: new Date(),
        step: 'processing',
        retryCount: (call.error?.retryCount || 0) + 1
      };
      await call.save();
    }
    
    // Emit error status
    if (global.io) {
      global.io.to(`call-${callId}`).emit('call-status-update', {
        callId,
        status: 'error',
        message: `Processing failed: ${error.message}`,
        error: error.message
      });
    }
  }
};

/**
 * @desc    Get call history with filters
 * @route   GET /api/calls/history
 * @access  Private
 */
const getCallHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      callType,
      priority,
      startDate,
      endDate,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const startIndex = (page - 1) * limit;
    
    // Build filter object
    const filter = { user: req.user.id };
    
    if (status) filter.status = status;
    if (callType) filter['metadata.callType'] = callType;
    if (priority) filter['metadata.priority'] = priority;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (search) {
      filter.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { 'metadata.notes': { $regex: search, $options: 'i' } },
        { 'transcript.text': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const calls = await Call.find(filter)
      .sort(sort)
      .skip(startIndex)
      .limit(parseInt(limit))
      .populate('user', 'name email role department')
      .select('-transcript.segments -performance.apiCalls');

    const total = await Call.countDocuments(filter);

    // Calculate statistics
    const stats = await Call.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalCalls: { $sum: 1 },
          avgScore: { $avg: '$analysis.overallScore' },
          totalDuration: { $sum: '$duration' },
          avgProcessingTime: { $avg: '$performance.processingTime' },
          completedCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          errorCalls: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        calls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: stats[0] || {
          totalCalls: 0,
          avgScore: 0,
          totalDuration: 0,
          avgProcessingTime: 0,
          completedCalls: 0,
          errorCalls: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get call analytics and trends
 * @route   GET /api/calls/analytics
 * @access  Private
 */
const getCallAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const analytics = await Call.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          avgScore: { $avg: '$analysis.overallScore' },
          totalDuration: { $sum: '$duration' },
          avgProcessingTime: { $avg: '$performance.processingTime' },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          errors: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Performance metrics by call type
    const performanceByType = await Call.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$metadata.callType',
          count: { $sum: 1 },
          avgScore: { $avg: '$analysis.overallScore' },
          avgProcessingTime: { $avg: '$performance.processingTime' }
        }
      }
    ]);

    // Quality distribution
    const qualityDistribution = await Call.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate },
          'analysis.overallScore': { $exists: true }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$analysis.overallScore', 60] }, then: 'Poor' },
                { case: { $lt: ['$analysis.overallScore', 80] }, then: 'Fair' },
                { case: { $lt: ['$analysis.overallScore', 90] }, then: 'Good' }
              ],
              default: 'Excellent'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        dailyTrends: analytics,
        performanceByType,
        qualityDistribution,
        period
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get call processing history
 * @route   GET /api/calls/:id/history
 * @access  Private
 */
const getCallProcessingHistory = async (req, res) => {
  try {
    const call = await Call.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        error: 'Call not found'
      });
    }

    // Check if user owns this call or is admin/supervisor
    if (call.user.toString() !== req.user.id && 
        !['admin', 'supervisor'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this call'
      });
    }

    res.json({
      success: true,
      data: {
        processingHistory: call.processingHistory,
        performance: call.performance,
        error: call.error,
        quality: call.quality
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
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
};
