# Docker Setup Instructions for OMIND.AI

This document provides comprehensive instructions for running OMIND.AI using Docker containers for both development and production environments.

## 🐳 Prerequisites

- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)
- OpenAI API key
- At least 4GB RAM available for Docker

## 🚀 Quick Start with Docker

### 1. Clone and Setup
```bash
git clone <repository-url>
cd omind-ai-project
```

### 2. Environment Configuration
```bash
# Create environment file
cp backend/env.example .env

# Edit .env with your OpenAI API key
echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env
```

### 3. Start Development Environment
```bash
# Start all services with hot reloading
docker-compose -f docker-compose.dev.yml up --build

# Or start in background
docker-compose -f docker-compose.dev.yml up -d --build
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs
- **MongoDB**: localhost:27017

## 🏭 Production Deployment

### 1. Production Build
```bash
# Build production images
docker-compose up --build

# Or build specific services
docker-compose build backend frontend
```

### 2. Production Environment Variables
Create `.env.production`:
```env
NODE_ENV=production
OPENAI_API_KEY=your_production_api_key
JWT_SECRET=your_super_secure_jwt_secret
MONGODB_URI=mongodb://admin:password123@mongodb:27017/omind_ai?authSource=admin
```

### 3. Start Production Services
```bash
# Start all production services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🔧 Development Workflow

### Hot Reloading
The development setup includes hot reloading:
- **Backend**: Changes to Node.js files trigger automatic restart
- **Frontend**: React development server with live reload
- **Database**: Persistent volume for data storage

### Making Changes
```bash
# Edit files in your IDE
# Changes are automatically reflected in containers

# View logs for specific service
docker-compose logs -f backend

# Restart specific service
docker-compose restart backend
```

### Database Management
```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p password123

# Backup database
docker-compose exec mongodb mongodump --out /backup

# Restore database
docker-compose exec mongodb mongorestore /backup
```

## 🛠️ Service Management

### Start Services
```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up backend

# Start in background
docker-compose up -d
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f frontend
```

### Health Checks
```bash
# Check service health
docker-compose ps

# Health check endpoints
curl http://localhost:5000/health  # Backend
curl http://localhost:3000/health  # Frontend
```

## 🔒 Security Considerations

### Production Security
1. **Change default passwords**
   - MongoDB admin password
   - JWT secret key
   - API keys

2. **Network security**
   - Use internal Docker networks
   - Expose only necessary ports
   - Implement proper firewall rules

3. **Data protection**
   - Encrypt sensitive data
   - Regular backups
   - Access logging

### Environment Variables
```bash
# Required for production
JWT_SECRET=your_super_secure_random_string
OPENAI_API_KEY=your_openai_api_key
MONGODB_URI=your_mongodb_connection_string

# Optional
NODE_ENV=production
PORT=5000
MAX_FILE_SIZE=10485760
```

## 📊 Monitoring and Logging

### Application Logs
```bash
# View application logs
docker-compose logs -f

# Log rotation
docker-compose exec backend logrotate /etc/logrotate.conf
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Container inspection
docker inspect omind-backend
```

### Health Monitoring
- Backend health check: `/health`
- Frontend health check: `/health`
- Database connectivity check
- API endpoint monitoring

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and deploy
        run: |
          docker-compose build
          docker-compose up -d
```

### Docker Registry
```bash
# Build and push to registry
docker build -t your-registry/omind-backend:latest .
docker push your-registry/omind-backend:latest
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :5000
   
   # Change ports in docker-compose.yml
   ports:
     - "5001:5000"  # Use different host port
   ```

2. **Memory issues**
   ```bash
   # Increase Docker memory limit
   # Docker Desktop → Settings → Resources → Memory: 4GB+
   ```

3. **Permission issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

4. **Database connection**
   ```bash
   # Check MongoDB status
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

### Debug Commands
```bash
# Enter container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# Check network connectivity
docker-compose exec backend ping mongodb

# View container environment
docker-compose exec backend env
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose up --scale backend=3

# Load balancer configuration
# Add nginx or HAProxy for load balancing
```

### Resource Limits
```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

## 🎯 Best Practices

1. **Use specific image tags**
   ```yaml
   image: node:18-alpine  # Instead of node:latest
   ```

2. **Implement health checks**
   ```yaml
   healthcheck:
     test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
     interval: 30s
     timeout: 10s
     retries: 3
   ```

3. **Use multi-stage builds**
   - Reduce image size
   - Improve security
   - Faster builds

4. **Persistent data**
   ```yaml
   volumes:
     - mongodb_data:/data/db
     - ./uploads:/app/uploads
   ```

5. **Environment separation**
   - Development: `docker-compose.dev.yml`
   - Production: `docker-compose.yml`
   - Testing: `docker-compose.test.yml`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Image](https://hub.docker.com/_/mongo)
- [Node.js Docker Image](https://hub.docker.com/_/node)

---

**Note**: This setup provides a complete containerized environment for OMIND.AI. For production deployment, ensure proper security measures, monitoring, and backup strategies are implemented.
