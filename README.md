# OMIND.AI - Contact Center AI Agent

A comprehensive MERN stack application for contact center call analysis and agent coaching using AI/ML components. This system provides end-to-end workflow from audio upload to personalized coaching plans.

## 🎥 Live Demo

**Watch the complete project demonstration:**

[![OMIND.AI Demo Video](https://img.shields.io/badge/Watch%20Demo-Loom%20Video-blue?style=for-the-badge&logo=loom)](https://www.loom.com/share/c2fd01d8e8d749a4b746a6ef454ede81?sid=0df97361-1708-4da2-b2f1-da53264204d4)


## 🏗️ Architecture Diagram & System Design

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
                       │ • Hugging Face  │
                       │   (Whisper STT) │
                       │ • Sentiment API │
                       │ • Toxicity API  │
                       │ • Cost Tracking │
                       │ • Rate Limiting │
                       └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

1. Audio Upload → Backend → Hugging Face Whisper → Transcription
2. Transcription → Sentiment API → Toxicity API → Local Analysis → MongoDB
3. Analysis → Coaching Generation → MongoDB
4. Real-time Updates → WebSocket → Frontend
5. Dashboard → Analytics → Performance Metrics

┌─────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYERS                                │
└─────────────────────────────────────────────────────────────────────────────┘

• JWT Authentication
• File Upload Validation
• Rate Limiting (API & AI Services)
• CORS Configuration
• Input Sanitization
• Error Handling & Logging
```

## 📋 Deliverables Overview

### ✅ Completed Deliverables

1. **Architecture Diagram and Description** - Comprehensive system design in `SYSTEM_DESIGN.md`
2. **Codebase for UI (React), Backend (Node/Express), and Integration Scripts** - Complete MERN stack implementation
3. **Docker Files and Instructions** - Full containerization with `DOCKER_SETUP.md`
4. **Sample Uploaded Calls** - Audio files in `/backend/uploads/`
5. **Demonstrated End-to-End Workflow** - Audio upload → transcription → analysis → coaching plan
6. **Unit Test Files** - Comprehensive API testing in `/backend/tests/`
7. **API Documentation** - Swagger/Postman collection in `/docs/`
8. **README with Setup Instructions** - Complete documentation below

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB Atlas account (free tier)
- Hugging Face API token (free tier available)

### Option 1: Local Development
```bash
# Clone and setup
git clone <repository-url>
cd omind-ai-project
./setup.sh

# Start services
cd backend && npm run dev
cd frontend && npm start
```

### Option 2: Docker Development
```bash
# Clone and setup
git clone <repository-url>
cd omind-ai-project

# Start with Docker
docker-compose -f docker-compose.dev.yml up --build
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Docs**: http://localhost:5000/api-docs

## 🔧 Configuration

### Environment Variables
Create `.env` file in backend directory:
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_atlas_uri

# Hugging Face (for Whisper STT)
HUGGINGFACE_TOKEN=your_huggingface_token

# JWT
JWT_SECRET=your_jwt_secret

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Free Tier Services Setup
1. **Hugging Face**: Sign up at https://huggingface.co/ (free API access)
2. **MongoDB Atlas**: Sign up at https://www.mongodb.com/atlas (free cluster)

## 📊 Features

### Call Analysis Metrics (9 Key Dimensions)
- **Call Opening (0-100)**: Professional greeting assessment
- **Issue Understanding (0-100)**: Problem identification accuracy
- **Sentiment Analysis (0-100)**: Agent tone and empathy analysis
- **Politeness (0-100)**: Toxicity and politeness scoring
- **Clarity (0-100)**: Communication clarity assessment
- **Engagement (0-100)**: Customer engagement level
- **Relevance (0-100)**: Response relevance to customer needs
- **CSAT Score (0-100)**: Customer satisfaction prediction
- **Resolution Quality (0-100)**: Problem-solving effectiveness

### Coaching Plan Generation
- Personalized feedback based on analysis
- Recommended call examples
- Interactive quiz with completion tracking
- Performance improvement suggestions

### Real-time Features
- WebSocket connections for live updates
- Progress tracking during AI processing
- Real-time dashboard updates

### Advanced Analytics
- Performance tracking over time
- Call history and statistics
- Quality metrics visualization
- Agent performance insights

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/demo-login   - Demo login (no password)
GET  /api/auth/me          - Get current user
PUT  /api/auth/profile     - Update profile
```

### Call Management Endpoints
```
POST /api/calls/upload     - Upload audio file
GET  /api/calls           - Get all calls (paginated)
GET  /api/calls/:id       - Get specific call
GET  /api/calls/:id/analysis - Get analysis results
GET  /api/calls/:id/coaching - Get coaching plan
GET  /api/calls/stats     - Get call statistics
```

### Analysis Endpoints
```
POST /api/analysis/transcribe    - Transcribe audio
POST /api/analysis/analyze       - Analyze transcript
POST /api/analysis/coaching      - Generate coaching plan
POST /api/analysis/cost-estimate - Estimate costs
```

**Full API Documentation**: See `API_DOCUMENTATION.md` and `docs/postman_collection.json`

## 🧪 Testing

### Unit Tests
```bash
cd backend
npm test
```

### API Testing
- **Postman Collection**: Import `docs/postman_collection.json`
- **Swagger UI**: Visit http://localhost:5000/api-docs

### Demo Mode
- Use any email address for login
- No password required
- Instant access to all features

## 🏗️ Technical Architecture

### Frontend (React 18)
- Material-UI for modern UI components
- React Router for navigation
- Context API for state management
- WebSocket for real-time updates
- Recharts for data visualization

### Backend (Node.js/Express)
- RESTful API with JWT authentication
- MongoDB with Mongoose ODM
- File upload handling with Multer
- Rate limiting and security middleware
- Swagger API documentation

### AI/ML Pipeline
- Hugging Face Whisper for speech-to-text
- Sentiment analysis API for tone analysis
- Toxicity analysis API for politeness scoring
- Custom algorithms for call quality metrics
- Cost tracking and rate limiting

### Database (MongoDB)
- User management and authentication
- Call records with full metadata
- Analysis results and coaching plans
- Optimized indexing strategy

## 🔒 Security Features

- JWT authentication with bcrypt password hashing
- File upload validation (type, size, content)
- API rate limiting (100 requests per 15 minutes)
- CORS configuration for cross-origin requests
- Input sanitization and validation
- Error handling without sensitive data exposure

## 🚧 Challenges Faced & Tradeoffs

### AI Service Integration
**Challenge**: Rate limits and costs of external AI APIs
- **Solution**: Implemented Hugging Face for STT, local analysis algorithms
- **Tradeoff**: Slightly reduced accuracy vs. cost optimization

### File Processing
**Challenge**: Large audio files and processing time
- **Solution**: Streaming uploads, background processing, progress tracking
- **Tradeoff**: Complex implementation vs. better user experience

### Real-time Updates
**Challenge**: Long AI processing times affecting user experience
- **Solution**: WebSocket connections, status tracking, progress indicators
- **Tradeoff**: Additional complexity vs. real-time feedback

### Database Design
**Challenge**: Balancing normalization vs. query performance
- **Solution**: Denormalized call data with embedded analysis results
- **Tradeoff**: Storage space vs. query efficiency

### Authentication
**Challenge**: Balancing security vs. ease of demo
- **Solution**: JWT with demo mode option
- **Tradeoff**: Security complexity vs. user accessibility

## 🔮 Next Steps for Scaling, Security, and Extension

### Production Enhancements
1. **Docker containerization**
   - Multi-stage builds for optimization
   - Docker Compose for local development
   - Kubernetes deployment manifests

2. **Cloud Infrastructure**
   - AWS S3 for file storage
   - Redis for caching and sessions
   - Elasticsearch for advanced search
   - Load balancer configuration

3. **Security Improvements**
   - OAuth 2.0 integration
   - API key rotation
   - Audit logging
   - Penetration testing

4. **Performance Optimization**
   - Database indexing strategy
   - CDN integration
   - Image optimization
   - Code splitting

### Feature Extensions
1. **Advanced Analytics**
   - Custom scoring models
   - Trend analysis
   - Predictive insights
   - A/B testing framework

2. **Multi-language Support**
   - Internationalization (i18n)
   - Multi-language transcription
   - Cultural context awareness

3. **Integration Capabilities**
   - CRM system integration (Salesforce, HubSpot)
   - Call center platform integration
   - Webhook support
   - API marketplace

4. **AI Model Improvements**
   - Custom fine-tuned models
   - Multi-modal analysis (video calls)
   - Real-time call monitoring
   - Automated coaching suggestions

### Scalability Roadmap
1. **Microservices Architecture**
   - Split into auth, calls, analysis, coaching services
   - Message queue for async processing
   - Service discovery and load balancing

2. **Data Pipeline**
   - Apache Kafka for event streaming
   - Data warehouse integration
   - Real-time analytics dashboard

3. **Machine Learning Pipeline**
   - Model training infrastructure
   - A/B testing for model versions
   - Automated retraining pipelines

## 📁 Project Structure

```
omind-ai-project/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   └── callController.js    # Call management
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── errorHandler.js     # Error handling
│   │   ├── rateLimiter.js      # Rate limiting
│   │   └── upload.js           # File upload handling
│   ├── models/
│   │   ├── User.js             # User schema
│   │   └── Call.js             # Call schema
│   ├── routes/
│   │   ├── auth.js             # Auth endpoints
│   │   ├── calls.js            # Call endpoints
│   │   └── analysis.js         # Analysis endpoints
│   ├── services/
│   │   └── openaiService.js    # AI service integration
│   ├── tests/
│   │   └── api.test.js         # Unit tests
│   ├── uploads/                # Sample audio files
│   ├── server.js               # Main application
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js       # Main layout
│   │   │   └── PrivateRoute.js # Route protection
│   │   ├── contexts/
│   │   │   └── AuthContext.js  # Authentication state
│   │   ├── pages/
│   │   │   ├── Login.js        # Authentication
│   │   │   ├── Dashboard.js    # Main dashboard
│   │   │   ├── CallUpload.js   # File upload
│   │   │   ├── CallDetail.js   # Call details
│   │   │   ├── CallAnalysis.js # Analysis results
│   │   │   ├── CoachingPlan.js # Coaching display
│   │   │   ├── CallHistory.js  # Call history
│   │   │   ├── Analytics.js    # Analytics dashboard
│   │   │   └── Profile.js      # User profile
│   │   ├── services/
│   │   │   ├── api.js          # Base API config
│   │   │   ├── authService.js  # Auth API calls
│   │   │   ├── callService.js  # Call API calls
│   │   │   └── websocketService.js # WebSocket handling
│   │   └── App.js              # Main application
│   └── package.json
├── docs/
│   └── postman_collection.json # API testing collection
├── Dockerfile                  # Backend Dockerfile
├── docker-compose.yml          # Production Docker setup
├── docker-compose.dev.yml      # Development Docker setup
├── setup.sh                    # Setup script
├── README.md                   # This file
├── SYSTEM_DESIGN.md            # Detailed system design
├── TECHNICAL_ARCHITECTURE.md   # Technical architecture details
├── ARCHITECTURE.md             # Architecture documentation
├── API_DOCUMENTATION.md        # API reference
├── DOCKER_SETUP.md             # Docker instructions
└── DEPLOYMENT.md               # Production deployment guide
```

## 🎯 End-to-End Workflow Demonstration

### 1. Audio Upload
- User uploads audio file (WAV, MP3, M4A)
- File validation and processing
- Real-time progress tracking

### 2. Transcription
- Hugging Face Whisper API processes audio
- Generates accurate transcript
- Stores in database with metadata

### 3. Analysis
- Sentiment analysis API for tone assessment
- Toxicity analysis for politeness scoring
- Local algorithms for clarity, engagement, relevance
- Scores across 9 key metrics
- Generates detailed insights

### 4. Coaching Plan
- AI generates personalized recommendations
- Creates interactive learning materials
- Tracks completion and progress

### 5. Results Display
- Real-time dashboard updates
- Visual analytics and charts
- Performance tracking over time

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

---

**Note**: This is a prototype implementation demonstrating strong architecture, module integration, and ability to orchestrate agentic AI flows. For production use, additional security, performance, and scalability measures should be implemented as outlined in the Next Steps section.

## 📚 Additional Documentation

- **System Design**: `SYSTEM_DESIGN.md` - Comprehensive system architecture
- **Technical Architecture**: `TECHNICAL_ARCHITECTURE.md` - Detailed technical implementation
- **Architecture**: `ARCHITECTURE.md` - Architecture documentation
- **API Documentation**: `API_DOCUMENTATION.md` - Complete API reference
- **Docker Setup**: `DOCKER_SETUP.md` - Containerization instructions
- **Deployment**: `DEPLOYMENT.md` - Production deployment guide
- **Postman Collection**: `docs/postman_collection.json` - API testing

