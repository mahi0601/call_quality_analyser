# OMIND.AI API Documentation

## Base URL
- **Development**: `http://localhost:5000`
- **Production**: `https://api.omind.ai`

## Authentication
All requests require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

## Key Endpoints

### Authentication
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login  
POST /api/auth/demo-login   - Demo login (no password)
GET  /api/auth/me          - Get current user
PUT  /api/auth/profile     - Update profile
```

### Call Management
```
POST /api/calls/upload     - Upload audio file
GET  /api/calls           - Get all calls (paginated)
GET  /api/calls/:id       - Get specific call
GET  /api/calls/:id/analysis - Get analysis results
GET  /api/calls/:id/coaching - Get coaching plan
GET  /api/calls/stats     - Get call statistics
```

### Analysis
```
POST /api/analysis/transcribe    - Transcribe audio
POST /api/analysis/analyze       - Analyze transcript
POST /api/analysis/coaching      - Generate coaching plan
POST /api/analysis/cost-estimate - Estimate costs
```

## Example Requests

### Upload Audio File
```bash
curl -X POST http://localhost:5000/api/calls/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "audioFile=@audio.mp3"
```

### Get Call Analysis
```bash
curl -X GET http://localhost:5000/api/calls/64f8a1b2c3d4e5f6a7b8c9d1/analysis \
  -H "Authorization: Bearer $TOKEN"
```

## WebSocket Events
```javascript
// Join call room
socket.emit('join-call-room', { callId: 'call_id' });

// Listen for updates
socket.on('call-status-update', (data) => {
  console.log('Status:', data.status, 'Progress:', data.progress);
});

socket.on('analysis-complete', (data) => {
  console.log('Analysis complete:', data.analysis);
});
```

## Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Rate Limits
- Authentication: 10 requests/15min
- File upload: 5 requests/15min  
- Analysis: 20 requests/15min
- General API: 100 requests/15min

## Full Documentation
- **Swagger UI**: `http://localhost:5000/api-docs`
- **Postman Collection**: `docs/postman_collection.json`
