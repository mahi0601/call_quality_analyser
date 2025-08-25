#!/bin/bash

# OMIND.AI Setup Script
# This script sets up the complete OMIND.AI development environment

set -e

echo "🚀 Starting OMIND.AI Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Detected macOS"
    PLATFORM="macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_status "Detected Linux"
    PLATFORM="linux"
else
    print_error "Unsupported operating system: $OSTYPE"
    exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    print_status "Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) ✓"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

print_success "npm $(npm -v) ✓"

# Check Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_success "Git $(git --version) ✓"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    print_success "Docker $(docker --version) ✓"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not found. Docker setup will be skipped."
    print_status "To use Docker, install Docker Desktop: https://www.docker.com/products/docker-desktop"
    DOCKER_AVAILABLE=false
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    print_success "Docker Compose $(docker-compose --version) ✓"
    DOCKER_COMPOSE_AVAILABLE=true
else
    print_warning "Docker Compose not found."
    DOCKER_COMPOSE_AVAILABLE=false
fi

echo ""
print_status "Setting up backend..."

# Backend setup
cd backend

# Install dependencies
print_status "Installing backend dependencies..."
npm install

# Create environment file
if [ ! -f .env ]; then
    print_status "Creating .env file..."
    cp env.example .env
    print_warning "Please edit backend/.env with your API keys"
    print_status "Required: OPENAI_API_KEY, MONGODB_URI, JWT_SECRET"
else
    print_success ".env file already exists"
fi

# Create uploads directory
mkdir -p uploads

cd ..

echo ""
print_status "Setting up frontend..."

# Frontend setup
cd frontend

# Install dependencies
print_status "Installing frontend dependencies..."
npm install

cd ..

echo ""
print_status "Setting up documentation..."

# Create docs directory if it doesn't exist
mkdir -p docs

# Check if Postman collection exists
if [ ! -f docs/postman_collection.json ]; then
    print_warning "Postman collection not found. You can import it later from the docs folder."
fi

echo ""
print_status "Environment Configuration"

# Create root .env file for Docker
if [ ! -f .env ]; then
    print_status "Creating root .env file for Docker..."
    cat > .env << EOF
# OMIND.AI Environment Variables
# Copy this file and add your actual API keys

# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# MongoDB URI (Optional - will use Docker MongoDB if not set)
# MONGODB_URI=mongodb://admin:password123@localhost:27017/omind_ai?authSource=admin

# JWT Secret (Optional - will use default for development)
# JWT_SECRET=your_super_secure_jwt_secret

# Node Environment
NODE_ENV=development

# Server Port
PORT=5000

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
EOF
    print_warning "Please edit .env with your actual API keys"
else
    print_success "Root .env file already exists"
fi

echo ""
print_status "Setup Summary"

print_success "✅ Backend dependencies installed"
print_success "✅ Frontend dependencies installed"
print_success "✅ Environment files created"
print_success "✅ Uploads directory created"

if [ "$DOCKER_AVAILABLE" = true ]; then
    print_success "✅ Docker environment ready"
fi

echo ""
print_status "Next Steps:"

echo "1. Configure API Keys:"
echo "   - Edit backend/.env with your OpenAI API key"
echo "   - Get free OpenAI credits: https://platform.openai.com/"

echo ""
echo "2. Start the application:"
echo "   Option A - Local Development:"
echo "   cd backend && npm run dev"
echo "   cd frontend && npm start"
echo ""
echo "   Option B - Docker (if available):"
echo "   docker-compose -f docker-compose.dev.yml up --build"

echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo "   - API Docs: http://localhost:5000/api-docs"

echo ""
echo "4. Demo Login:"
echo "   - Use any email address"
echo "   - No password required"
echo "   - Perfect for testing and demonstrations"

echo ""
print_status "Documentation:"
echo "- README.md: Complete project documentation"
echo "- API_DOCUMENTATION.md: API reference"
echo "- DOCKER_SETUP.md: Docker setup instructions"
echo "- docs/postman_collection.json: API testing collection"

echo ""
print_success "🎉 Setup complete! Happy coding!"

# Make script executable
chmod +x setup.sh
