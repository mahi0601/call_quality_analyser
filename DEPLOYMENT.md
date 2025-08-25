# OMIND.AI Deployment Guide

Comprehensive deployment guide for OMIND.AI Contact Center AI Agent system in production environments.

## 🚀 Production Deployment

### Prerequisites
- Docker and Docker Compose installed
- Cloud provider account (AWS, GCP, Azure)
- Domain name and SSL certificate
- MongoDB Atlas cluster
- OpenAI API key

### Environment Setup

#### 1. Production Environment Variables
Create `.env.production`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/omind_ai
OPENAI_API_KEY=your_production_openai_key
JWT_SECRET=your_super_secure_jwt_secret_key
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads
REDIS_URL=redis://redis:6379
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=omind-ai-uploads
```

#### 2. Docker Production Build
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Start production services
docker-compose -f docker-compose.yml up -d

# Check service status
docker-compose ps
```

#### 3. Database Setup
```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh

# Create indexes
db.calls.createIndex({userId: 1, createdAt: -1})
db.calls.createIndex({status: 1})
db.calls.createIndex({transcript: "text"})
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance Setup
```bash
# Launch EC2 instance (t3.medium or larger)
# Install Docker and Docker Compose
sudo yum update -y
sudo yum install -y docker
sudo service docker start
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url>
cd omind-ai-project

# Configure environment
cp .env.production .env
# Edit .env with production values

# Deploy application
docker-compose up -d

# Setup Nginx reverse proxy
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 3. Nginx Configuration
```nginx
# /etc/nginx/conf.d/omind.conf
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 4. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Kubernetes Deployment

#### 1. Cluster Setup
```bash
# Create EKS cluster
eksctl create cluster --name omind-cluster --region us-west-2 --nodegroup-name standard-workers --node-type t3.medium --nodes 3 --nodes-min 1 --nodes-max 4

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name omind-cluster
```

#### 2. Kubernetes Manifests

**ConfigMap** (`k8s/configmap.yaml`):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: omind-config
data:
  NODE_ENV: "production"
  PORT: "5000"
  MAX_FILE_SIZE: "10485760"
```

**Secret** (`k8s/secret.yaml`):
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: omind-secrets
type: Opaque
data:
  MONGODB_URI: <base64-encoded-mongodb-uri>
  OPENAI_API_KEY: <base64-encoded-openai-key>
  JWT_SECRET: <base64-encoded-jwt-secret>
```

**Deployment** (`k8s/deployment.yaml`):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: omind-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: omind-backend
  template:
    metadata:
      labels:
        app: omind-backend
    spec:
      containers:
      - name: backend
        image: omind-backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: omind-config
        - secretRef:
            name: omind-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service** (`k8s/service.yaml`):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: omind-backend-service
spec:
  selector:
    app: omind-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

#### 3. Deploy to Kubernetes
```bash
# Apply manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
```

## 📊 Monitoring & Observability

### Application Monitoring

#### 1. Health Checks
```bash
# Backend health check
curl http://your-domain.com/health

# Frontend health check
curl http://your-domain.com/health
```

#### 2. Logging Setup
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes logs
kubectl logs -f deployment/omind-backend
```

#### 3. Prometheus & Grafana
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'omind-backend'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
```

### Performance Monitoring

#### 1. Database Monitoring
```javascript
// MongoDB connection monitoring
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
```

#### 2. API Performance Metrics
```javascript
// Response time monitoring
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

## 🔒 Security Hardening

### 1. Network Security
```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Container Security
```dockerfile
# Use non-root user
USER nodejs

# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image omind-backend:latest
```

### 3. API Security
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## 📈 Scaling Strategies

### 1. Horizontal Scaling
```bash
# Scale backend services
docker-compose up --scale backend=3

# Kubernetes scaling
kubectl scale deployment omind-backend --replicas=5
```

### 2. Load Balancing
```nginx
# Nginx load balancer configuration
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

### 3. Database Scaling
```javascript
// MongoDB read replicas
const mongoose = require('mongoose');

mongoose.connect('mongodb://primary:27017,replica1:27017,replica2:27017/omind_ai', {
  replicaSet: 'rs0',
  readPreference: 'secondaryPreferred'
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd backend
          npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build Docker images
        run: |
          docker build -t omind-backend:${{ github.sha }} .
          docker build -t omind-frontend:${{ github.sha }} ./frontend

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy to your cloud provider
          echo "Deploying to production..."
```

## 🚨 Disaster Recovery

### 1. Backup Strategy
```bash
# Database backup
docker-compose exec mongodb mongodump --out /backup/$(date +%Y%m%d)

# File backup
aws s3 sync /app/uploads s3://omind-ai-backups/uploads/

# Configuration backup
cp .env /backup/env-$(date +%Y%m%d)
```

### 2. Recovery Procedures
```bash
# Database restore
docker-compose exec mongodb mongorestore /backup/20240115/

# Application rollback
docker-compose down
docker-compose up -d --force-recreate
```

## 📊 Performance Optimization

### 1. Caching Strategy
```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();

// Cache analysis results
app.get('/api/calls/:id/analysis', async (req, res) => {
  const cacheKey = `analysis:${req.params.id}`;
  const cached = await client.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Fetch from database and cache
  const analysis = await Call.findById(req.params.id).select('analysis');
  await client.setex(cacheKey, 3600, JSON.stringify(analysis));
  res.json(analysis);
});
```

### 2. Database Optimization
```javascript
// Database indexing
db.calls.createIndex({userId: 1, createdAt: -1});
db.calls.createIndex({status: 1});
db.calls.createIndex({transcript: "text"});

// Query optimization
const calls = await Call.find({userId: req.user.id})
  .select('filename status createdAt analysis.overallScore')
  .sort({createdAt: -1})
  .limit(10);
```

## 🎯 Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring tools set up
- [ ] Security scanning completed
- [ ] Load testing performed

### Post-Deployment
- [ ] Health checks passing
- [ ] Logs monitored for errors
- [ ] Performance metrics tracked
- [ ] Backup verification
- [ ] User acceptance testing
- [ ] Documentation updated

## 📚 Additional Resources

- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Deployment Guide](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [MongoDB Atlas Best Practices](https://docs.atlas.mongodb.com/best-practices/)

---

**Note**: This deployment guide provides a comprehensive approach to deploying OMIND.AI in production. Always test thoroughly in staging environments before deploying to production.
