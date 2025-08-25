# OMIND.AI Technical Architecture

## Overview

This document provides a detailed technical architecture analysis of the OMIND.AI system based on the current implementation. It covers the code structure, design patterns, data flow, and system interactions.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OMIND.AI TECHNICAL ARCHITECTURE               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   WebSocket     │    │   File Upload   │
│   (Port 3000)   │◄──►│   Connection    │◄──►│   Interface     │
│                 │    │                 │    │                 │
│ • Material-UI   │    │ • Real-time     │    │ • Drag & Drop   │
│ • React Router  │    │   Updates       │    │ • Progress Bar  │
│ • Context API   │    │ • Status Events │    │ • Validation    │
│ • Axios Client  │    │ • Notifications │    │ • Preview       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY LAYER                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Express.js    │    │   Middleware    │    │   Route Handler │
│   Server        │◄──►│   Stack         │◄──►│   Controllers   │
│   (Port 5000)   │    │                 │    │                 │
│                 │    │ • Helmet.js     │    │ • Auth Controller│
│ • HTTP Server   │    │ • CORS          │    │ • Call Controller│
│ • Socket.io     │    │ • Rate Limiter  │    │ • Analysis Ctrl │
│ • Static Files  │    │ • Body Parser   │    │ • Error Handler │
│ • Swagger Docs  │    │ • Morgan Logger │    │ • Validation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BUSINESS LOGIC LAYER                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Services   │    │   File Handler  │    │   Data Models   │
│                 │◄──►│                 │◄──►│                 │
│ • Hugging Face  │    │ • Multer        │    │ • User Schema   │
│ • Sentiment API │    │ • File Validation│   │ • Call Schema   │
│ • Toxicity API  │    │ • Storage       │    │ • Indexes       │
│ • Local Analysis│    │ • Cleanup       │    │ • Virtuals      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MongoDB       │    │   File System   │    │   Cache Layer   │
│   Atlas         │◄──►│   (Uploads)     │◄──►│   (Future)      │
│                 │    │                 │    │                 │
│ • User Data     │    │ • Audio Files   │    │ • Redis         │
│ • Call Records  │    │ • Temp Storage  │    │ • Session Store │
│ • Analysis Data │    │ • Backup        │    │ • API Cache     │
│ • Performance   │    │ • Cleanup       │    │ • Rate Limiting │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Detailed Component Analysis

### 1. Frontend Architecture (React 18)

#### Component Structure
```javascript
// App.js - Main Application Component
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<CallUpload />} />
              <Route path="calls/:id" element={<CallDetail />} />
              <Route path="calls/:id/analysis" element={<CallAnalysis />} />
              <Route path="calls/:id/coaching" element={<CoachingPlan />} />
              <Route path="history" element={<CallHistory />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};
```

#### State Management Pattern
```javascript
// AuthContext.js - Global State Management
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    // JWT authentication logic
  };

  const logout = () => {
    // Cleanup and redirect
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### API Service Pattern
```javascript
// api.js - Base API Configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// Request interceptor for JWT tokens
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 2. Backend Architecture (Node.js/Express)

#### Server Configuration
```javascript
// server.js - Main Server Setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing and logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimiter);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
```

#### WebSocket Implementation
```javascript
// Real-time communication
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-call-room', (callId) => {
    socket.join(`call-${callId}`);
    console.log(`👥 Client ${socket.id} joined call room: ${callId}`);
  });

  socket.on('leave-call-room', (callId) => {
    socket.leave(`call-${callId}`);
    console.log(`👋 Client ${socket.id} left call room: ${callId}`);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});
```

#### Route Structure
```javascript
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/analysis', analysisRoutes);

// Health check and documentation
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'OMIND.AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

### 3. Data Model Architecture

#### User Schema
```javascript
// User.js - User Data Model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

#### Call Schema (Current Implementation)
```javascript
// Call.js - Call Data Model
const callSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  duration: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['uploaded', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'generating-coaching', 'completed', 'error'],
    default: 'uploaded'
  },
  transcript: {
    text: String,
    segments: [{
      start: Number,
      end: Number,
      text: String,
      speaker: String
    }],
    language: String,
    confidence: Number
  },
  analysis: {
    overallScore: { type: Number, min: 0, max: 100 },
    metrics: {
      callOpening: { type: Number, min: 0, max: 100 },
      issueUnderstanding: { type: Number, min: 0, max: 100 },
      sentimentAnalysis: { type: Number, min: 0, max: 100 },
      politeness: { type: Number, min: 0, max: 100 },
      clarity: { type: Number, min: 0, max: 100 },
      engagement: { type: Number, min: 0, max: 100 },
      relevance: { type: Number, min: 0, max: 100 },
      csatScore: { type: Number, min: 0, max: 100 },
      resolutionQuality: { type: Number, min: 0, max: 100 }
    },
    feedback: {
      callOpening: String,
      issueUnderstanding: String,
      sentimentAnalysis: String,
      politeness: String,
      clarity: String,
      engagement: String,
      relevance: String,
      csatScore: String,
      resolutionQuality: String
    },
    keyPoints: [String],
    issues: [String],
    recommendations: [String]
  },
  coachingPlan: {
    generated: { type: Boolean, default: false },
    feedback: String,
    recommendations: String, // JSON string
    resources: String, // JSON string
    quiz: String, // JSON string
    completionCriteria: { type: String, default: 'Complete all recommendations and pass the quiz' }
  },
  metadata: {
    customerId: String,
    callType: { type: String, enum: ['inbound', 'outbound', 'support', 'sales', 'other'], default: 'support' },
    tags: [String],
    notes: String,
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  },
  processingHistory: [{
    step: { type: String, enum: ['upload', 'transcribe', 'analyze', 'coaching'], required: true },
    status: { type: String, enum: ['started', 'completed', 'failed'], required: true },
    message: String,
    timestamp: { type: Date, default: Date.now },
    duration: Number,
    error: {
      message: String,
      code: String,
      stack: String
    }
  }],
  error: {
    message: String,
    code: String,
    timestamp: Date,
    step: String,
    retryCount: { type: Number, default: 0 }
  },
  performance: {
    processingTime: Number,
    transcriptionTime: Number,
    analysisTime: Number,
    coachingTime: Number,
    apiCalls: [{
      service: String,
      endpoint: String,
      duration: Number,
      status: String,
      timestamp: Date
    }]
  },
  quality: {
    audioQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
    transcriptionConfidence: Number,
    analysisConfidence: Number,
    flaggedIssues: [{
      type: String,
      severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      description: String,
      timestamp: Date
    }]
  }
}, {
  timestamps: true
});
```

### 4. AI/ML Pipeline Architecture

#### Service Layer Pattern
```javascript
// openaiService.js - AI Service Integration
class OpenAIService {
  constructor() {
    this.huggingFaceToken = process.env.HUGGINGFACE_TOKEN || '';
  }

  async transcribeAudio(filePath) {
    try {
      console.log('🎵 Transcribing audio...');
      
      const audioBuffer = fs.readFileSync(filePath);
      
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
        audioBuffer,
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'audio/mpeg',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      const transcript = response.data.text;
      console.log('✅ Transcription completed');
      
      return {
        text: transcript,
        segments: [
          {
            start: 0,
            end: 30,
            text: transcript,
            speaker: "agent"
          }
        ],
        language: "en",
        duration: 45,
        confidence: 0.9
      };
    } catch (error) {
      console.error('❌ Transcription failed:', error.response?.status || error.message);
      throw new Error(`Transcription failed: ${error.response?.status === 404 ? 'Model not found' : 'Service unavailable'}`);
    }
  }

  async analyzeCall(transcript) {
    try {
      console.log('🔍 Analyzing call...');
      
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Real-time sentiment analysis
      const sentimentScores = await this.analyzeSentiment(sentences.slice(0, 3));
      
      // Real-time toxicity analysis
      const toxicityScores = await this.analyzeToxicity(sentences.slice(0, 3));
      
      // Local analysis for other metrics
      const clarityScore = this.analyzeClarity(transcript);
      const engagementScore = this.analyzeEngagement(transcript);
      const relevanceScore = this.analyzeRelevance(transcript);
      
      const overallSentiment = this.calculateOverallSentiment(sentimentScores);
      const overallPoliteness = this.calculateOverallPoliteness(toxicityScores);
      
      const analysis = {
        overallScore: Math.round((overallSentiment + overallPoliteness + clarityScore + engagementScore + relevanceScore) / 5),
        metrics: {
          callOpening: this.analyzeCallOpening(transcript),
          issueUnderstanding: this.analyzeIssueUnderstanding(transcript),
          sentimentAnalysis: overallSentiment,
          politeness: overallPoliteness,
          clarity: clarityScore,
          engagement: engagementScore,
          relevance: relevanceScore,
          csatScore: Math.round((overallSentiment + overallPoliteness + relevanceScore) / 3),
          resolutionQuality: this.analyzeResolutionQuality(transcript)
        },
        feedback: {
          callOpening: this.getCallOpeningFeedback(transcript),
          issueUnderstanding: this.getIssueUnderstandingFeedback(transcript),
          sentimentAnalysis: this.getSentimentFeedback(overallSentiment),
          politeness: this.getPolitenessFeedback(overallPoliteness),
          clarity: this.getClarityFeedback(clarityScore),
          engagement: this.getEngagementFeedback(engagementScore),
          relevance: this.getRelevanceFeedback(relevanceScore),
          csatScore: this.getCSATFeedback(overallSentiment, overallPoliteness, relevanceScore),
          resolutionQuality: this.getResolutionFeedback(transcript)
        },
        keyPoints: this.extractKeyPoints(transcript),
        issues: this.identifyIssues(transcript),
        recommendations: this.generateRecommendations(transcript)
      };
      
      console.log('✅ Analysis completed');
      return analysis;
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw new Error('Analysis failed: Unable to process transcript');
    }
  }
}
```

## Data Flow Architecture

### 1. File Upload Flow
```
User Upload → Frontend Validation → Multer Middleware → File Storage → Database Record → Processing Queue
```

### 2. Transcription Flow
```
Audio File → Hugging Face API → Transcript Processing → Database Update → WebSocket Notification
```

### 3. Analysis Flow
```
Transcript → Sentiment API → Toxicity API → Local Analysis → Score Calculation → Database Update → WebSocket Notification
```

### 4. Real-time Updates Flow
```
Processing Step → WebSocket Event → Frontend Update → UI Refresh
```

## Security Architecture

### Authentication Flow
```javascript
// JWT Token Generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Token Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};
```

### Rate Limiting
```javascript
// Rate Limiter Configuration
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

## Performance Optimization

### Database Indexing
```javascript
// Optimized Indexes for Query Performance
callSchema.index({ user: 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ 'analysis.overallScore': -1 });
callSchema.index({ 'metadata.callType': 1 });
callSchema.index({ 'metadata.priority': 1 });
callSchema.index({ 'quality.audioQuality': 1 });
callSchema.index({ 'processingHistory.step': 1 });
callSchema.index({ 'processingHistory.status': 1 });
```

### Query Optimization
```javascript
// Efficient Database Queries
const getCallsForUser = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const calls = await Call.find({ user: userId })
    .select('fileName originalName status createdAt analysis.overallScore')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
  const total = await Call.countDocuments({ user: userId });
  
  return {
    calls,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

## Error Handling Architecture

### Global Error Handler
```javascript
// errorHandler.js - Centralized Error Handling
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'The provided ID is not valid'
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate Error',
      message: 'This record already exists'
    });
  }

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};
```

### Processing Error Handling
```javascript
// Call Processing Error Management
callSchema.methods.addProcessingStep = function(step, status, message, duration, error = null) {
  this.processingHistory.push({
    step,
    status,
    message,
    duration,
    error: error ? {
      message: error.message,
      code: error.code,
      stack: error.stack
    } : undefined
  });
  
  if (status === 'failed') {
    this.error = {
      message: error?.message || message,
      code: error?.code || 'PROCESSING_ERROR',
      timestamp: new Date(),
      step
    };
  }
  
  return this.save();
};
```

## Monitoring and Observability

### Health Check Endpoint
```javascript
// Health Check Implementation
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'OMIND.AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    uptime: process.uptime()
  });
});
```

### Performance Monitoring
```javascript
// API Performance Tracking
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log to performance tracking system
    if (duration > 1000) {
      console.warn(`Slow API call: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});
```

## Conclusion

The OMIND.AI technical architecture demonstrates a well-structured, scalable, and maintainable system design. The implementation follows modern best practices for:

- **Modular Architecture**: Clear separation of concerns
- **Security**: Comprehensive authentication and authorization
- **Performance**: Optimized database queries and indexing
- **Reliability**: Robust error handling and monitoring
- **Scalability**: Stateless design ready for horizontal scaling
- **Maintainability**: Clean code patterns and documentation

The system successfully integrates multiple AI services while maintaining high performance and reliability standards suitable for production deployment.
