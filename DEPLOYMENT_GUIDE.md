# CMS Complete Deployment Guide

A comprehensive guide to deploy the College Management System locally and on production servers.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Local Development Setup](#4-local-development-setup)
5. [Local Full Stack Deployment](#5-local-full-stack-deployment)
6. [Production VPS Deployment](#6-production-vps-deployment)
7. [SSL Certificate Setup](#7-ssl-certificate-setup)
8. [Environment Configuration](#8-environment-configuration)
9. [CI/CD with GitHub Actions](#9-cicd-with-github-actions)
10. [Maintenance & Operations](#10-maintenance--operations)
11. [Backup & Restore](#11-backup--restore)
12. [Monitoring & Health Checks](#12-monitoring--health-checks)
13. [Troubleshooting](#13-troubleshooting)
14. [Security Checklist](#14-security-checklist)

---

## 1. Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                    │
│                                  │                                       │
│                                  ▼                                       │
│                        ┌─────────────────┐                              │
│                        │      Nginx      │                              │
│                        │  Reverse Proxy  │ Port 80/443                  │
│                        │  SSL + Caching  │                              │
│                        └────────┬────────┘                              │
│                                 │                                        │
│         ┌───────────────────────┼───────────────────────┐               │
│         │                       │                       │                │
│         ▼                       ▼                       ▼                │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐          │
│  │  Frontend   │        │   Backend   │        │    MinIO    │          │
│  │   React     │        │   NestJS    │        │  S3 Storage │          │
│  │   Nginx     │        │  PM2 Cluster│        │             │          │
│  │   :80       │        │    :5000    │        │  :9000/9001 │          │
│  └─────────────┘        └──────┬──────┘        └─────────────┘          │
│                                │                                         │
│                    ┌───────────┴───────────┐                            │
│                    │                       │                             │
│                    ▼                       ▼                             │
│           ┌─────────────┐         ┌─────────────┐                       │
│           │   MongoDB   │         │ DragonflyDB │                       │
│           │   7.0 LTS   │         │   (Redis)   │                       │
│           │   :27017    │         │    :6379    │                       │
│           └─────────────┘         └─────────────┘                       │
│                                                                          │
│                         Docker Network (cms-network)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | React 19 + Vite + Tailwind | Latest |
| Backend | NestJS + Prisma | Latest |
| Database | MongoDB | 7.0 LTS |
| Cache | DragonflyDB (Redis-compatible) | v1.24.0 |
| Storage | MinIO (S3-compatible) | Latest Stable |
| Process Manager | PM2 | Latest |
| Web Server | Nginx | 1.27-alpine |
| Container | Docker + Docker Compose | Latest |

### Docker Images Used

| Service | Image | Tag |
|---------|-------|-----|
| Node.js | node | 20.18-alpine |
| Nginx | nginx | 1.27-alpine |
| MongoDB | mongo | 7.0 |
| DragonflyDB | dragonflydb/dragonfly | v1.24.0 |
| MinIO | minio/minio | RELEASE.2024-12-18T13-15-44Z |
| Certbot | certbot/certbot | latest |

---

## 2. Prerequisites

### For Local Development

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Git**
- **Node.js 20+** (optional, for running without Docker)

### For Production VPS

- **Ubuntu 20.04+** or **Debian 11+**
- **2+ vCPU, 4+ GB RAM, 40+ GB SSD**
- **Domain name** pointed to your server IP
- **SSH access** to the server

### Verify Docker Installation

```bash
# Check Docker
docker --version
# Expected: Docker version 24.x or higher

# Check Docker Compose
docker compose version
# Expected: Docker Compose version v2.x
```

---

## 3. Project Structure

```
cms/
├── backend/
│   ├── Dockerfile              # Backend Docker image
│   ├── ecosystem.config.js     # PM2 cluster configuration
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/                    # NestJS source code
│   └── package.json
│
├── frontend/
│   ├── Dockerfile              # Frontend Docker image
│   ├── nginx.conf              # Frontend Nginx config
│   ├── src/                    # React source code
│   └── package.json
│
├── nginx/                      # Reverse proxy configuration
│   ├── nginx.conf              # Main Nginx config
│   ├── conf.d/
│   │   └── default.conf        # Site configuration
│   └── snippets/
│       └── locations.conf      # Location blocks
│
├── docker/
│   └── mongo-init.js           # MongoDB initialization
│
├── scripts/
│   ├── deploy.sh               # Linux deployment script
│   ├── deploy.ps1              # Windows deployment script
│   ├── setup-vps.sh            # VPS automated setup
│   └── setup-ssl.sh            # SSL certificate setup
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions CI/CD
│
├── docker-compose.yml          # Local development (full stack)
├── docker-compose.dev.yml      # Development (infrastructure only)
├── docker-compose.prod.yml     # Production with reverse proxy
│
├── .env.docker                 # Environment template (local)
├── .env.production             # Environment template (production)
└── DEPLOYMENT_GUIDE.md         # This file
```

---

## 4. Local Development Setup

Use this setup when you want to run frontend and backend locally with hot-reloading, but use Docker for databases and services.

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/cms.git
cd cms
```

### Step 2: Start Infrastructure Services

**Windows (PowerShell):**
```powershell
.\scripts\deploy.ps1 dev
```

**Linux/macOS:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh dev
```

This starts:
- MongoDB on `localhost:27017`
- DragonflyDB (Redis) on `localhost:6379`
- MinIO on `localhost:9000` (API) and `localhost:9001` (Console)

### Step 3: Configure Backend Environment

Create `backend/.env`:

```env
# Database
DATABASE_URL=mongodb://cmsuser:cmspassword123@localhost:27017/cms?authSource=cms

# Cache
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=development-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Server
PORT=5000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:5173

# MinIO/S3
AWS_S3_ENDPOINT=http://localhost:9000
AWS_S3_BUCKET=cms-uploads
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
AWS_REGION=us-east-1
AWS_S3_FORCE_PATH_STYLE=true

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Step 4: Configure Frontend Environment

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=CMS Portal
VITE_APP_ENV=development
```

### Step 5: Install Dependencies and Run

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Step 6: Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| API Health | http://localhost:5000/health |
| MinIO Console | http://localhost:9001 |

### Step 7: Stop Infrastructure

```powershell
# Windows
.\scripts\deploy.ps1 dev-stop

# Linux/macOS
./scripts/deploy.sh dev-stop
```

---

## 5. Local Full Stack Deployment

Use this setup to test the complete Docker deployment locally.

### Step 1: Create Environment File

```bash
# Copy template
cp .env.docker .env

# Edit if needed (defaults work for local testing)
```

### Step 2: Start All Services

**Windows (PowerShell):**
```powershell
.\scripts\deploy.ps1 start
```

**Linux/macOS:**
```bash
./scripts/deploy.sh start
```

### Step 3: Wait for Services

The script will show service status. Wait about 60 seconds for all services to be healthy.

### Step 4: Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost |
| Backend API | http://localhost:5000/api |
| API Health | http://localhost:5000/health |
| MinIO Console | http://localhost:9001 |

### Step 5: Useful Commands

```powershell
# View logs
.\scripts\deploy.ps1 logs

# View specific service logs
.\scripts\deploy.ps1 logs backend

# Check status
.\scripts\deploy.ps1 status

# Check health
.\scripts\deploy.ps1 health

# Restart services
.\scripts\deploy.ps1 restart

# Stop all services
.\scripts\deploy.ps1 stop

# Remove everything (including data)
.\scripts\deploy.ps1 clean
```

---

## 6. Production VPS Deployment

### Option A: Automated Setup (Recommended)

This method handles everything automatically.

#### Step 1: Prepare Your Domain

1. Purchase a domain (e.g., `cms.example.com`)
2. Create DNS A records:

| Type | Name | Value |
|------|------|-------|
| A | @ | YOUR_SERVER_IP |
| A | www | YOUR_SERVER_IP |

3. Wait 5-10 minutes for DNS propagation

#### Step 2: Connect to Your VPS

```bash
ssh root@YOUR_SERVER_IP
```

#### Step 3: Download and Run Setup Script

**Option A: Clone from Git**
```bash
# Clone repository
git clone https://github.com/your-org/cms.git /opt/cms
cd /opt/cms

# Make script executable
chmod +x scripts/setup-vps.sh

# Run setup with your domain and email
./scripts/setup-vps.sh cms.example.com admin@example.com
```

**Option B: Upload Files Manually**
```bash
# On your local machine, upload files
scp -r ./* root@YOUR_SERVER_IP:/tmp/cms-source/

# SSH to server
ssh root@YOUR_SERVER_IP

# Run setup
mkdir -p /opt/cms
cp -r /tmp/cms-source/* /opt/cms/
cd /opt/cms
chmod +x scripts/setup-vps.sh
./scripts/setup-vps.sh cms.example.com admin@example.com
```

#### Step 4: What the Script Does

The automated script performs these steps:

1. **System Update**
   - Updates all packages
   - Installs required dependencies

2. **Docker Installation**
   - Installs Docker Engine
   - Installs Docker Compose plugin
   - Enables Docker service

3. **Security Configuration**
   - Configures UFW firewall (ports 22, 80, 443)
   - Sets up Fail2Ban for brute-force protection

4. **Application Setup**
   - Creates `/opt/cms` directory
   - Copies all application files
   - Generates secure passwords automatically
   - Creates `.env` file with your domain

5. **Container Deployment**
   - Builds all Docker images
   - Starts all containers
   - Waits for services to be healthy

6. **SSL Certificate**
   - Obtains Let's Encrypt SSL certificate
   - Configures Nginx for HTTPS
   - Sets up auto-renewal

7. **Maintenance Setup**
   - Creates backup script
   - Creates update script
   - Configures daily backup cron job

#### Step 5: Verify Deployment

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check health
curl https://cms.example.com/health

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

### Option B: Manual Setup

If you prefer manual control, follow these steps.

#### Step 1: Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git ufw fail2ban
```

#### Step 2: Install Docker

```bash
# Remove old versions
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker repository
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
systemctl start docker
systemctl enable docker

# Verify
docker --version
docker compose version
```

#### Step 3: Configure Firewall

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```

#### Step 4: Configure Fail2Ban

```bash
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
EOF

systemctl restart fail2ban
systemctl enable fail2ban
```

#### Step 5: Upload Application Files

```bash
mkdir -p /opt/cms
cd /opt/cms

# Option 1: Clone from Git
git clone https://github.com/your-org/cms.git .

# Option 2: Already uploaded to /tmp/cms-source
cp -r /tmp/cms-source/* .
```

#### Step 6: Create Environment File

```bash
# Generate secure passwords
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)
MONGO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
MINIO_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)

# Create .env file
cat > /opt/cms/.env << EOF
# Domain
DOMAIN=cms.example.com

# Application
NODE_ENV=production
LOG_LEVEL=warn
VERSION=latest

# URLs
FRONTEND_URL=https://cms.example.com
CORS_ORIGIN=https://cms.example.com
ALLOWED_ORIGINS=https://cms.example.com,https://www.cms.example.com
VITE_API_BASE_URL=/api
VITE_APP_NAME=CMS Portal
VITE_APP_ENV=production

# Database
DATABASE_URL=mongodb://cmsuser:cmspassword123@mongodb:27017/cms?authSource=cms
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=${MONGO_PASSWORD}
MONGO_DATABASE=cms

# Cache
REDIS_URL=redis://dragonfly:6379

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# File Upload
MAX_FILE_SIZE=10485760

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
AWS_S3_BUCKET=cms-uploads
AWS_REGION=us-east-1

# PM2
PM2_INSTANCES=max
EOF

# Secure the file
chmod 600 /opt/cms/.env
```

#### Step 7: Configure Nginx for Your Domain

```bash
# Replace YOUR_DOMAIN in nginx config
sed -i 's/YOUR_DOMAIN/cms.example.com/g' /opt/cms/nginx/conf.d/default.conf
```

#### Step 8: Start Containers

```bash
cd /opt/cms
docker compose -f docker-compose.prod.yml up -d --build
```

#### Step 9: Wait for Services

```bash
# Wait 60 seconds
sleep 60

# Check status
docker compose -f docker-compose.prod.yml ps

# All services should show "healthy" status
```

#### Step 10: Setup SSL Certificate

```bash
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh cms.example.com admin@example.com
```

---

## 7. SSL Certificate Setup

### Automatic Setup (During VPS Setup)

SSL is automatically configured when you run `setup-vps.sh`.

### Manual SSL Setup

If you need to set up SSL separately:

```bash
cd /opt/cms
chmod +x scripts/setup-ssl.sh
./scripts/setup-ssl.sh your-domain.com your-email@example.com
```

### What the SSL Script Does

1. Requests certificate from Let's Encrypt
2. Updates Nginx configuration for HTTPS
3. Configures HTTP to HTTPS redirect
4. Sets up auto-renewal cron job

### Renew Certificate Manually

```bash
cd /opt/cms
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Check Certificate Status

```bash
docker compose -f docker-compose.prod.yml run --rm certbot certificates
```

---

## 8. Environment Configuration

### Environment Variables Reference

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Your domain name | `cms.example.com` |
| `JWT_SECRET` | JWT signing key (64+ chars) | `openssl rand -base64 48` |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password | `openssl rand -base64 24` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password (8+ chars) | `openssl rand -base64 24` |

#### Application Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `LOG_LEVEL` | Logging level | `warn` |
| `PORT` | Backend port | `5000` |
| `PM2_INSTANCES` | PM2 cluster instances | `max` |

#### Database Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | See template |
| `MONGO_ROOT_USER` | MongoDB root username | `admin` |
| `MONGO_DATABASE` | Database name | `cms` |
| `REDIS_URL` | Redis/DragonflyDB URL | `redis://dragonfly:6379` |

#### Security Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | JWT token expiry | `24h` |
| `THROTTLE_TTL` | Rate limit window (seconds) | `60` |
| `THROTTLE_LIMIT` | Max requests per window | `100` |
| `ALLOWED_ORIGINS` | CORS allowed origins | Your domain |

#### Storage Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_S3_BUCKET` | MinIO bucket name | `cms-uploads` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` (10MB) |

#### Optional Integrations

| Variable | Description |
|----------|-------------|
| `MAIL_USER` | SMTP email address |
| `MAIL_PASS` | SMTP password/app password |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |

### Generate Secure Passwords

```bash
# Generate JWT secret (64 characters)
openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64

# Generate database password (32 characters)
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32

# Generate MinIO password (32 characters)
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32
```

---

## 9. CI/CD with GitHub Actions

### Setup GitHub Actions

#### Step 1: Add Repository Secrets

Go to: Repository → Settings → Secrets and variables → Actions

**Required Secrets:**

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | VPS IP address or hostname |
| `DEPLOY_USER` | SSH username (usually `root`) |
| `DEPLOY_SSH_KEY` | Private SSH key (PEM format) |
| `DEPLOY_PORT` | SSH port (default: `22`) |

**To generate SSH key:**
```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions" -f github-actions-key

# Copy public key to server
ssh-copy-id -i github-actions-key.pub root@YOUR_SERVER_IP

# Add private key content to DEPLOY_SSH_KEY secret
cat github-actions-key
```

#### Step 2: Add Repository Variables

Go to: Repository → Settings → Secrets and variables → Actions → Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | API URL for frontend | `/api` or `https://api.example.com` |
| `VITE_APP_NAME` | Application name | `CMS Portal` |
| `DEPLOY_PATH` | Server deployment path | `/opt/cms` |
| `DEPLOY_URL` | Production URL | `https://cms.example.com` |

### Workflow Triggers

| Trigger | Action |
|---------|--------|
| Push to `main` | Build, test, and deploy to production |
| Push to `develop` | Build and test only |
| Pull Request | Run tests |
| Manual dispatch | Deploy to selected environment |

### Manual Deployment

1. Go to: Actions → CI/CD Pipeline
2. Click "Run workflow"
3. Select environment (staging/production)
4. Click "Run workflow"

---

## 10. Maintenance & Operations

### Service Management Commands

```bash
cd /opt/cms

# View all containers
docker compose -f docker-compose.prod.yml ps

# View logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# View logs (specific service)
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f mongodb
docker compose -f docker-compose.prod.yml logs -f nginx

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart backend

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Rebuild and restart (after code changes)
docker compose -f docker-compose.prod.yml up -d --build

# View resource usage
docker stats
```

### Update Application

```bash
cd /opt/cms

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Clean old images
docker image prune -f
```

Or use the update script:
```bash
/opt/cms/scripts/update.sh
```

### PM2 Management (Inside Backend Container)

```bash
# Enter backend container
docker exec -it cms-backend sh

# View PM2 status
pm2 status

# View PM2 logs
pm2 logs

# Restart PM2 processes
pm2 restart all

# Exit container
exit
```

### Database Access

```bash
# MongoDB shell
docker exec -it cms-mongodb mongosh -u admin -p YOUR_PASSWORD

# Common MongoDB commands
use cms
db.users.find().limit(5)
db.stats()

# Redis CLI
docker exec -it cms-dragonfly redis-cli
ping
keys *
```

---

## 11. Backup & Restore

### Automated Backups

Backups are configured automatically by the setup script:
- Runs daily at 2 AM
- Stored in `/opt/cms/backups/`
- Keeps last 7 days

### Manual Backup

```bash
/opt/cms/scripts/backup.sh
```

Or manually:

```bash
cd /opt/cms
mkdir -p backups
DATE=$(date +%Y%m%d_%H%M%S)

# Backup MongoDB
docker exec cms-mongodb mongodump \
  --out /data/backup \
  --authenticationDatabase admin \
  -u admin \
  -p YOUR_MONGO_PASSWORD

# Copy to host
docker cp cms-mongodb:/data/backup ./backups/mongodb_$DATE

# Compress
tar -czf backups/backup_$DATE.tar.gz -C backups mongodb_$DATE
rm -rf backups/mongodb_$DATE

echo "Backup saved: backups/backup_$DATE.tar.gz"
```

### Restore Database

```bash
cd /opt/cms
DATE=20241224_020000  # Replace with your backup date

# Extract backup
tar -xzf backups/backup_$DATE.tar.gz -C backups/

# Stop backend (prevents writes during restore)
docker compose -f docker-compose.prod.yml stop backend

# Copy to container
docker cp backups/mongodb_$DATE cms-mongodb:/data/restore

# Restore
docker exec cms-mongodb mongorestore \
  /data/restore \
  --authenticationDatabase admin \
  -u admin \
  -p YOUR_MONGO_PASSWORD \
  --drop

# Start backend
docker compose -f docker-compose.prod.yml start backend

# Clean up
rm -rf backups/mongodb_$DATE
```

### Backup MinIO Files

```bash
# Using MinIO Client
docker run --rm -it \
  --network cms-prod-network \
  -v $(pwd)/backups:/backup \
  minio/mc \
  mirror myminio/cms-uploads /backup/minio_$(date +%Y%m%d)
```

---

## 12. Monitoring & Health Checks

### Health Check Endpoints

| Endpoint | Description |
|----------|-------------|
| `/health` | Basic health check |
| `/health/db` | Database health |
| `/health/redis` | Redis health |
| `/health/detailed` | Full system health |
| `/health/ready` | Readiness probe |
| `/health/live` | Liveness probe |

### Check System Health

```bash
# From server
curl -s http://localhost/health | jq

# From outside
curl -s https://cms.example.com/health | jq

# Detailed health
curl -s https://cms.example.com/health/detailed | jq
```

### Monitor Resources

```bash
# Docker container stats
docker stats

# Disk usage
df -h

# Docker disk usage
docker system df

# Memory usage
free -h

# CPU load
uptime
```

### Log Monitoring

```bash
# Real-time logs
docker compose -f docker-compose.prod.yml logs -f

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100

# Filter errors
docker compose -f docker-compose.prod.yml logs 2>&1 | grep -i error
```

---

## 13. Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs backend

# Check if ports are in use
netstat -tlnp | grep -E '80|443|5000|27017|6379|9000'

# Restart Docker daemon
systemctl restart docker

# Rebuild containers
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Database Connection Failed

```bash
# Check MongoDB logs
docker logs cms-mongodb --tail=50

# Test MongoDB connection
docker exec cms-mongodb mongosh --eval "db.adminCommand('ping')"

# Check if MongoDB is running
docker ps | grep mongodb

# Restart MongoDB
docker compose -f docker-compose.prod.yml restart mongodb
```

### Backend Health Check Failing

```bash
# Check backend logs
docker logs cms-backend --tail=100

# Check PM2 status inside container
docker exec cms-backend pm2 status
docker exec cms-backend pm2 logs

# Restart backend
docker compose -f docker-compose.prod.yml restart backend
```

### SSL Certificate Issues

```bash
# Check certificate status
docker compose -f docker-compose.prod.yml run --rm certbot certificates

# Test nginx configuration
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Force renew certificate
docker compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal

# Reload nginx
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### Nginx Not Starting

```bash
# Check nginx logs
docker logs cms-nginx --tail=50

# Test configuration
docker compose -f docker-compose.prod.yml exec nginx nginx -t

# Check if port 80/443 is in use
netstat -tlnp | grep -E ':80|:443'
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Remove old logs
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# Remove old backups
find /opt/cms/backups -name "*.tar.gz" -mtime +7 -delete
```

### High Memory Usage

```bash
# Check memory
free -h

# Check Docker stats
docker stats --no-stream

# Restart high-memory containers
docker compose -f docker-compose.prod.yml restart backend
```

### Reset Everything

```bash
cd /opt/cms

# Stop and remove all containers, networks, volumes
docker compose -f docker-compose.prod.yml down -v --remove-orphans

# Remove all Docker resources (WARNING: removes all data)
docker system prune -a --volumes

# Start fresh
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 14. Security Checklist

### Before Going Live

- [ ] Changed `JWT_SECRET` to a secure random string (64+ characters)
- [ ] Changed `MONGO_ROOT_PASSWORD` to a strong password
- [ ] Changed `MINIO_ROOT_PASSWORD` to a strong password (8+ characters)
- [ ] SSL certificate installed and working
- [ ] HTTP redirects to HTTPS
- [ ] Firewall enabled (only ports 22, 80, 443 open)
- [ ] Fail2Ban running
- [ ] `NODE_ENV=production` set
- [ ] Removed or secured API documentation endpoint
- [ ] CORS configured for your domain only
- [ ] Rate limiting enabled
- [ ] Backups configured and tested
- [ ] `.env` file permissions set to 600

### Verify Security

```bash
# Check firewall
ufw status

# Check Fail2Ban
fail2ban-client status

# Check SSL grade (external)
# Visit: https://www.ssllabs.com/ssltest/

# Check open ports
netstat -tlnp

# Check file permissions
ls -la /opt/cms/.env
# Should show: -rw------- (600)
```

### Ongoing Security

- Keep system updated: `apt update && apt upgrade -y`
- Monitor logs for suspicious activity
- Review and rotate passwords periodically
- Keep Docker images updated
- Monitor SSL certificate expiry

---

## Quick Reference

### URLs After Deployment

| Service | Local | Production |
|---------|-------|------------|
| Frontend | http://localhost | https://your-domain.com |
| API | http://localhost:5000/api | https://your-domain.com/api |
| Health | http://localhost:5000/health | https://your-domain.com/health |
| MinIO Console | http://localhost:9001 | Internal only |

### Important Paths

| Path | Description |
|------|-------------|
| `/opt/cms` | Application root |
| `/opt/cms/.env` | Environment configuration |
| `/opt/cms/backups` | Backup files |
| `/var/log/nginx` | Nginx logs |

### Quick Commands

```bash
# Start
docker compose -f docker-compose.prod.yml up -d

# Stop
docker compose -f docker-compose.prod.yml down

# Logs
docker compose -f docker-compose.prod.yml logs -f

# Restart
docker compose -f docker-compose.prod.yml restart

# Status
docker compose -f docker-compose.prod.yml ps

# Backup
/opt/cms/scripts/backup.sh

# Update
/opt/cms/scripts/update.sh

# SSL Renew
/opt/cms/scripts/setup-ssl.sh your-domain.com your@email.com
```

---

## Support

If you encounter issues:

1. Check logs: `docker compose -f docker-compose.prod.yml logs`
2. Verify environment: `cat .env`
3. Check container status: `docker compose -f docker-compose.prod.yml ps`
4. Review this guide's troubleshooting section
5. Check GitHub Issues for known problems
