# OMIND.AI System Architecture

## Overview

OMIND.AI is a comprehensive contact center AI agent system that provides end-to-end call analysis and agent coaching. The system is built using a modern MERN stack with AI/ML integration for speech-to-text transcription, call quality analysis, and personalized coaching plan generation.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              OMIND.AI SYSTEM ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Express Backend│    │   MongoDB Atlas │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Cloud DB)    │
│                 │    │                 │    │                 │
│ • Login/Auth    │    │ • REST API      │    │ • User Data     │
│ • Dashboard     │    │ • File Upload   │    │ • Call Records  │
│ • Upload UI     │    │ • JWT Auth      │    │ • Analysis Data │
│ • Analysis View │    │ • Rate Limiting │    │ • Coaching Plans│
│ • Coaching Plan │    │ • WebSocket     │    │ • Call Metadata │
│ • Real-time UI  │    │ • Swagger Docs  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AI Services   │
                       │   (External)    │
                       │                 │
                       │ • OpenAI Whisper│
                       │   (Speech-to-Text)│
                       │ • OpenAI GPT-4  │
                       │   (Analysis)    │
                       │ • Cost Tracking │
                       │ • Rate Limiting │
                       └─────────────────┘
```

### Data Flow Architecture

```
1. Audio Upload → Backend → OpenAI Whisper → Transcription
2. Transcription → OpenAI GPT-4 → Analysis → MongoDB
3. Analysis → Coaching Generation → MongoDB
4. Real-time Updates → WebSocket → Frontend
5. Dashboard → Analytics → Performance Metrics
```

## Component Architecture

### 1. Frontend (React 18)

**Technology Stack:**
- React 18 with Hooks
- Material-UI (MUI) for UI components
- React Router for navigation
- Axios for API communication
- Socket.io-client for real-time updates
- Recharts for data visualization

**Key Components:**
```
src/
├── components/
│   ├── Layout.js           # Main layout wrapper
│   └── PrivateRoute.js     # Route protection
├── contexts/
│   └── AuthContext.js      # Authentication state management
├── pages/
│   ├── Login.js            # Authentication page
│   ├── Dashboard.js        # Main dashboard
│   ├── CallUpload.js       # File upload interface
│   ├── CallDetail.js       # Call details view
│   ├── CallAnalysis.js     # Analysis results
│   ├── CoachingPlan.js     # Coaching display
│   └── Profile.js          # User profile
├── services/
│   ├── api.js              # Base API configuration
│   ├── authService.js      # Authentication API calls
│   ├── callService.js      # Call management API calls
│   └── websocketService.js # WebSocket handling
└── utils/
    └── autoLogin.js        # Demo login utility
```

**State Management:**
- React Context for global state (authentication)
- Local state for component-specific data
- Real-time updates via WebSocket connections

### 2. Backend (Node.js/Express)

**Technology Stack:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Multer for file uploads
- Socket.io for real-time communication
- Swagger for API documentation
- Rate limiting and security middleware

**Architecture Pattern:**
```
backend/
├── config/
│   └── database.js          # Database connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── callController.js    # Call management
├── middleware/
│   ├── auth.js             # JWT authentication
│   ├── errorHandler.js     # Error handling
│   ├── rateLimiter.js      # Rate limiting
│   └── upload.js           # File upload handling
├── models/
│   ├── User.js             # User schema
│   └── Call.js             # Call schema
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── calls.js            # Call management routes
│   └── analysis.js         # Analysis routes
├── services/
│   └── openaiService.js    # AI service integration
└── server.js               # Main application
```

**API Design:**
- RESTful API design principles
- Consistent response format
- Comprehensive error handling
- Rate limiting and security
- Swagger documentation

### 3. Database (MongoDB)

**Schema Design:**

**User Schema:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date,
  updatedAt: Date
}
```

**Call Schema:**
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  filename: String,
  originalName: String,
  size: Number,
  status: String (uploaded, processing, completed, failed),
  duration: Number,
  transcript: String,
  analysis: {
    callOpening: Number (0-100),
    issueUnderstanding: Number (0-100),
    sentimentAnalysis: {
      agent: Number (0-100),
      customer: Number (0-100)
    },
    csatScore: Number (0-100),
    resolutionQuality: Number (0-100),
    overallScore: Number (0-100)
  },
  coachingPlan: {
    recommendations: [String],
    resources: [Object],
    quiz: [Object]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexing Strategy:**
- Compound index on `userId` and `createdAt`
- Index on `status` for filtering
- Text index on `transcript` for search

### 4. AI/ML Pipeline

**Technology Stack:**
- OpenAI Whisper API for speech-to-text
- OpenAI GPT-4 for call analysis
- Custom prompts for specific analysis tasks
- Cost tracking and rate limiting

**Analysis Pipeline:**
```
1. Audio Upload → File Validation → Storage
2. Transcription Request → OpenAI Whisper → Transcript
3. Analysis Request → OpenAI GPT-4 → Call Analysis
4. Coaching Generation → OpenAI GPT-4 → Coaching Plan
5. Results Storage → Database → Real-time Updates
```

**Analysis Metrics:**
- **Call Opening (0-100)**: Professional greeting assessment
- **Issue Understanding (0-100)**: Problem identification accuracy
- **Sentiment Analysis**: Agent and customer tone analysis
- **CSAT Score (0-100)**: Customer satisfaction inference
- **Resolution Quality (0-100)**: Problem-solving effectiveness

## Security Architecture

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Token expiration and refresh
- Role-based access control (ready for extension)

### API Security
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers

### File Upload Security
- File type validation (WAV, MP3, M4A)
- File size limits (10MB max)
- Virus scanning (ready for extension)
- Secure file storage

### Data Protection
- Environment variable management
- Sensitive data encryption
- Audit logging (ready for extension)
- GDPR compliance ready

## Scalability Architecture

### Horizontal Scaling
- Stateless backend design
- Database connection pooling
- Load balancer ready
- Microservices architecture ready

### Performance Optimization
- Database indexing strategy
- Caching layer ready (Redis)
- CDN integration ready
- Image optimization

### Monitoring & Observability
- Health check endpoints
- Error logging and tracking
- Performance metrics
- Real-time monitoring ready

## Deployment Architecture

### Development Environment
- Local development with hot reloading
- Docker Compose for containerized development
- Environment-specific configurations
- Debug logging and error handling

### Production Environment
- Docker containerization
- Kubernetes orchestration ready
- CI/CD pipeline ready
- Blue-green deployment ready

### Cloud Infrastructure
- AWS S3 for file storage
- MongoDB Atlas for database
- Redis for caching
- CDN for static assets

## Integration Architecture

### External Services
- OpenAI API integration
- Webhook support for notifications
- Third-party authentication ready
- CRM system integration ready

### API Design
- RESTful API with consistent patterns
- GraphQL ready for complex queries
- WebSocket for real-time updates
- API versioning strategy

## Data Architecture

### Data Flow
```
User Input → Validation → Processing → Storage → Analysis → Results
```

### Data Models
- Normalized user data
- Denormalized call data for performance
- Embedded analysis results
- Flexible schema for future extensions

### Backup & Recovery
- Automated database backups
- Point-in-time recovery
- Data retention policies
- Disaster recovery plan

## Testing Architecture

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for user flows
- Performance testing

### Test Environment
- Isolated test database
- Mock AI services
- Automated test execution
- Continuous testing

## Future Architecture Considerations

### Microservices Migration
- Service decomposition strategy
- API gateway implementation
- Service discovery and load balancing
- Distributed tracing

### Machine Learning Pipeline
- Custom model training
- A/B testing framework
- Model versioning
- Automated retraining

### Advanced Analytics
- Real-time analytics dashboard
- Predictive insights
- Custom scoring models
- Business intelligence integration

## Technology Decisions & Trade-offs

### Framework Choices
- **React**: Component reusability vs. learning curve
- **Express**: Simplicity vs. enterprise features
- **MongoDB**: Flexibility vs. ACID compliance
- **OpenAI**: Quality vs. cost and dependency

### Architecture Patterns
- **Monolithic**: Simplicity vs. scalability
- **REST API**: Standardization vs. over-fetching
- **JWT**: Stateless vs. token size
- **WebSocket**: Real-time vs. complexity

### Performance Considerations
- **Database indexing**: Query speed vs. storage
- **Caching**: Performance vs. consistency
- **File uploads**: User experience vs. server load
- **AI processing**: Quality vs. cost

## Conclusion

The OMIND.AI architecture provides a solid foundation for a scalable, maintainable, and secure contact center AI system. The modular design allows for easy extension and modification while maintaining high performance and reliability. The system is production-ready with proper security measures, monitoring capabilities, and deployment strategies in place.
