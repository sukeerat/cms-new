#!/bin/bash

# ===========================================
# CMS Docker Deployment Script
# ===========================================
# Usage: ./scripts/deploy.sh [command]
# Commands: start, stop, restart, logs, status, build, clean, dev, dev-stop, health

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default ports (can be overridden in .env)
FRONTEND_PORT=${FRONTEND_PORT:-80}
BACKEND_PORT=${BACKEND_PORT:-5000}
MINIO_CONSOLE_PORT=${MINIO_CONSOLE_PORT:-9001}

# Load environment variables if .env exists
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Functions
print_header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║       CMS Docker Deployment          ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

check_docker() {
    print_step "Checking Docker..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi

    print_success "Docker is running"
}

check_env() {
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        print_info "No .env file found. Creating from template..."
        cp "$PROJECT_ROOT/.env.docker" "$PROJECT_ROOT/.env"
        print_success ".env file created"
        print_info "Please review and update .env before deploying to production"
    fi
}

wait_for_health() {
    local service=$1
    local url=$2
    local max_attempts=${3:-30}
    local attempt=1

    print_info "Waiting for $service to be healthy..."

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$url" > /dev/null 2>&1; then
            print_success "$service is healthy"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo ""
    print_error "$service failed to become healthy after $max_attempts attempts"
    return 1
}

start() {
    print_header
    print_step "Starting CMS services..."

    check_docker
    check_env

    cd "$PROJECT_ROOT"

    print_info "Building and starting containers..."
    docker compose up -d --build

    echo ""
    print_success "All services started!"
    echo ""

    # Wait for services to be healthy
    print_step "Waiting for services to be ready..."
    sleep 10

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}Services Available:${NC}"
    echo -e "  Frontend:    ${BLUE}http://localhost:${FRONTEND_PORT}${NC}"
    echo -e "  Backend API: ${BLUE}http://localhost:${BACKEND_PORT}/api${NC}"
    echo -e "  API Docs:    ${BLUE}http://localhost:${BACKEND_PORT}/api/docs${NC}"
    echo -e "  MinIO UI:    ${BLUE}http://localhost:${MINIO_CONSOLE_PORT}${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    status
}

stop() {
    print_header
    print_step "Stopping CMS services..."

    cd "$PROJECT_ROOT"
    docker compose down

    print_success "All services stopped!"
}

restart() {
    print_header
    print_step "Restarting CMS services..."

    stop
    echo ""
    start
}

logs() {
    cd "$PROJECT_ROOT"
    if [ -z "$2" ]; then
        docker compose logs -f --tail=100
    else
        docker compose logs -f --tail=100 "$2"
    fi
}

status() {
    print_step "Service Status:"
    echo ""
    cd "$PROJECT_ROOT"
    docker compose ps
}

build() {
    print_header
    print_step "Building Docker images..."

    check_docker
    check_env

    cd "$PROJECT_ROOT"
    docker compose build --no-cache --parallel

    print_success "Images built successfully!"
}

clean() {
    print_header
    print_step "Cleaning up Docker resources..."

    read -p "This will remove all containers and volumes. Are you sure? (y/N) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$PROJECT_ROOT"
        docker compose down -v --remove-orphans
        docker image prune -f
        print_success "Cleanup complete!"
    else
        print_info "Cleanup cancelled"
    fi
}

dev() {
    print_header
    print_step "Starting development infrastructure..."

    check_docker

    cd "$PROJECT_ROOT"
    docker compose -f docker-compose.dev.yml up -d

    echo ""
    print_success "Development infrastructure started!"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}Infrastructure Services:${NC}"
    echo -e "  MongoDB:     ${BLUE}mongodb://localhost:27017${NC}"
    echo -e "  DragonflyDB: ${BLUE}redis://localhost:6379${NC}"
    echo -e "  MinIO API:   ${BLUE}http://localhost:9000${NC}"
    echo -e "  MinIO UI:    ${BLUE}http://localhost:9001${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    print_info "Run your applications locally:"
    echo "  cd frontend && npm run dev"
    echo "  cd backend && npm run start:dev"
    echo ""

    # Show dev connection strings
    echo -e "${YELLOW}Connection Strings for .env:${NC}"
    echo "  DATABASE_URL=mongodb://cmsuser:cmspassword123@localhost:27017/cms?authSource=cms"
    echo "  REDIS_URL=redis://localhost:6379"
    echo "  AWS_S3_ENDPOINT=http://localhost:9000"
}

dev_stop() {
    print_header
    print_step "Stopping development infrastructure..."

    cd "$PROJECT_ROOT"
    docker compose -f docker-compose.dev.yml down

    print_success "Development infrastructure stopped!"
}

health() {
    print_header
    print_step "Checking service health..."
    echo ""

    # Check backend
    if curl -sf "http://localhost:${BACKEND_PORT}/health" > /dev/null 2>&1; then
        print_success "Backend is healthy"
        curl -s "http://localhost:${BACKEND_PORT}/health" | head -c 200
        echo ""
    else
        print_error "Backend is not responding"
    fi

    # Check frontend
    if curl -sf "http://localhost:${FRONTEND_PORT}/health" > /dev/null 2>&1; then
        print_success "Frontend is healthy"
    else
        print_error "Frontend is not responding"
    fi

    # Check MongoDB
    if docker exec cms-mongodb mongosh --quiet --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB is healthy"
    else
        print_error "MongoDB is not responding"
    fi

    # Check DragonflyDB
    if docker exec cms-dragonfly redis-cli ping > /dev/null 2>&1; then
        print_success "DragonflyDB is healthy"
    else
        print_error "DragonflyDB is not responding"
    fi

    # Check MinIO
    if curl -sf "http://localhost:9000/minio/health/live" > /dev/null 2>&1; then
        print_success "MinIO is healthy"
    else
        print_error "MinIO is not responding"
    fi
}

pull() {
    print_header
    print_step "Pulling latest images..."

    cd "$PROJECT_ROOT"
    docker compose pull

    print_success "Images pulled successfully!"
}

shell() {
    local service=${2:-backend}
    print_info "Opening shell in $service container..."
    cd "$PROJECT_ROOT"
    docker compose exec "$service" sh
}

help() {
    print_header
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services (production)"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        View logs (optionally specify service: logs backend)"
    echo "  status      Show service status"
    echo "  build       Build Docker images (no cache)"
    echo "  clean       Remove containers and volumes"
    echo "  pull        Pull latest base images"
    echo "  shell       Open shell in container (default: backend)"
    echo "  dev         Start development infrastructure only"
    echo "  dev-stop    Stop development infrastructure"
    echo "  health      Check all service health"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start              # Start all services"
    echo "  $0 logs backend       # View backend logs"
    echo "  $0 shell mongodb      # Open MongoDB shell"
    echo "  $0 dev                # Start DB/Cache/Storage for local dev"
}

# Main
case "${1:-help}" in
    start)      start ;;
    stop)       stop ;;
    restart)    restart ;;
    logs)       logs "$@" ;;
    status)     status ;;
    build)      build ;;
    clean)      clean ;;
    pull)       pull ;;
    shell)      shell "$@" ;;
    dev)        dev ;;
    dev-stop)   dev_stop ;;
    health)     health ;;
    help|*)     help ;;
esac
