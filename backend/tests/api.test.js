const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Call = require('../models/Call');
const jwt = require('jsonwebtoken');

describe('OMIND.AI API Tests', () => {
  let authToken;
  let testUser;
  let testCall;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/omind_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Call.deleteMany({});

    // Create test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-secret');

    // Create test call
    testCall = new Call({
      userId: testUser._id,
      filename: 'test-audio.mp3',
      originalName: 'test-audio.mp3',
      size: 1024000,
      status: 'completed',
      duration: 180,
      transcript: 'Hello, this is a test call.',
      analysis: {
        callOpening: 85,
        issueUnderstanding: 92,
        sentimentAnalysis: {
          agent: 88,
          customer: 75
        },
        csatScore: 82,
        resolutionQuality: 90,
        overallScore: 87.2
      }
    });
    await testCall.save();
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/register - should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data).toHaveProperty('token');
    });

    test('POST /api/auth/login - should login existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
      expect(response.body.data).toHaveProperty('token');
    });

    test('POST /api/auth/demo-login - should allow demo login', async () => {
      const response = await request(app)
        .post('/api/auth/demo-login')
        .send({
          email: 'demo@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    test('GET /api/auth/me - should get current user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    test('PUT /api/auth/profile - should update user profile', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.name).toBe('Updated Name');
    });
  });

  describe('Call Management Endpoints', () => {
    test('POST /api/calls/upload - should upload audio file', async () => {
      const response = await request(app)
        .post('/api/calls/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('audioFile', Buffer.from('fake audio data'), 'test-audio.mp3');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.call).toHaveProperty('_id');
      expect(response.body.data.call.status).toBe('uploaded');
    });

    test('GET /api/calls - should get all calls for user', async () => {
      const response = await request(app)
        .get('/api/calls')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.calls).toHaveLength(1);
      expect(response.body.data.calls[0].filename).toBe('test-audio.mp3');
    });

    test('GET /api/calls/:id - should get specific call', async () => {
      const response = await request(app)
        .get(`/api/calls/${testCall._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.call._id).toBe(testCall._id.toString());
    });

    test('GET /api/calls/:id/analysis - should get call analysis', async () => {
      const response = await request(app)
        .get(`/api/calls/${testCall._id}/analysis`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis).toHaveProperty('callOpening');
      expect(response.body.data.analysis.overallScore).toBe(87.2);
    });

    test('GET /api/calls/:id/coaching - should get coaching plan', async () => {
      const response = await request(app)
        .get(`/api/calls/${testCall._id}/coaching`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.coachingPlan).toHaveProperty('recommendations');
    });

    test('GET /api/calls/stats - should get call statistics', async () => {
      const response = await request(app)
        .get('/api/calls/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toHaveProperty('totalCalls');
      expect(response.body.data.stats.totalCalls).toBe(1);
    });
  });

  describe('Analysis Endpoints', () => {
    test('POST /api/analysis/transcribe - should transcribe audio', async () => {
      const response = await request(app)
        .post('/api/analysis/transcribe')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          callId: testCall._id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('transcript');
    });

    test('POST /api/analysis/analyze - should analyze transcript', async () => {
      const response = await request(app)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          callId: testCall._id,
          transcript: 'Hello, this is customer service. How can I help you today?'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis).toHaveProperty('callOpening');
    });

    test('POST /api/analysis/coaching - should generate coaching plan', async () => {
      const response = await request(app)
        .post('/api/analysis/coaching')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          callId: testCall._id,
          analysis: {
            callOpening: 85,
            issueUnderstanding: 92,
            sentimentAnalysis: {
              agent: 88,
              customer: 75
            },
            csatScore: 82,
            resolutionQuality: 90
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.coachingPlan).toHaveProperty('recommendations');
    });

    test('POST /api/analysis/cost-estimate - should estimate costs', async () => {
      const response = await request(app)
        .post('/api/analysis/cost-estimate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          audioDuration: 180,
          transcriptLength: 500
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.estimate).toHaveProperty('totalCost');
    });
  });

  describe('Error Handling', () => {
    test('should return 401 for unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/calls');

      expect(response.status).toBe(401);
    });

    test('should return 404 for non-existent resources', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/calls/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    test('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      const requests = Array(105).fill().map(() => 
        request(app)
          .get('/api/calls')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('File Upload Validation', () => {
    test('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/calls/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('audioFile', Buffer.from('fake data'), 'test.txt');

      expect(response.status).toBe(400);
    });

    test('should reject files that are too large', async () => {
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB
      const response = await request(app)
        .post('/api/calls/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('audioFile', largeBuffer, 'large-audio.mp3');

      expect(response.status).toBe(400);
    });
  });
});
