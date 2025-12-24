# ===========================================
# CMS Docker Deployment Script for Windows
# ===========================================
# Usage: .\scripts\deploy.ps1 [command]
# Commands: start, stop, restart, logs, status, build, clean, dev, dev-stop, health

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$Service = ""
)

$ErrorActionPreference = "Stop"

# Project root directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Default ports
$FrontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "80" }
$BackendPort = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } else { "5000" }
$MinioConsolePort = if ($env:MINIO_CONSOLE_PORT) { $env:MINIO_CONSOLE_PORT } else { "9001" }

# Load .env file if exists
$envFile = Join-Path $ProjectRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value -ErrorAction SilentlyContinue
        }
    }
}

# Helper functions
function Write-Header {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "      CMS Docker Deployment          " -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[X] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[-] $Message" -ForegroundColor Yellow
}

function Write-Step {
    param([string]$Message)
    Write-Host "[>] $Message" -ForegroundColor Blue
}

function Test-Docker {
    Write-Step "Checking Docker..."

    try {
        $null = docker info 2>&1
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop."
        return $false
    }
}

function Test-EnvFile {
    $envFile = Join-Path $ProjectRoot ".env"
    $envDockerFile = Join-Path $ProjectRoot ".env.docker"

    if (-not (Test-Path $envFile)) {
        Write-Info "No .env file found. Creating from template..."
        Copy-Item $envDockerFile $envFile
        Write-Success ".env file created"
        Write-Info "Please review and update .env before deploying to production"
    }
}

function Start-Services {
    Write-Header
    Write-Step "Starting CMS services..."

    if (-not (Test-Docker)) { exit 1 }
    Test-EnvFile

    Set-Location $ProjectRoot

    Write-Info "Building and starting containers..."
    docker compose up -d --build

    Write-Host ""
    Write-Success "All services started!"
    Write-Host ""

    Write-Step "Waiting for services to be ready..."
    Start-Sleep -Seconds 10

    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Services Available:" -ForegroundColor Green
    Write-Host "  Frontend:    http://localhost:$FrontendPort" -ForegroundColor Blue
    Write-Host "  Backend API: http://localhost:$BackendPort/api" -ForegroundColor Blue
    Write-Host "  API Docs:    http://localhost:$BackendPort/api/docs" -ForegroundColor Blue
    Write-Host "  MinIO UI:    http://localhost:$MinioConsolePort" -ForegroundColor Blue
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    Get-Status
}

function Stop-Services {
    Write-Header
    Write-Step "Stopping CMS services..."

    Set-Location $ProjectRoot
    docker compose down

    Write-Success "All services stopped!"
}

function Restart-Services {
    Write-Header
    Write-Step "Restarting CMS services..."

    Stop-Services
    Write-Host ""
    Start-Services
}

function Get-Logs {
    Set-Location $ProjectRoot
    if ($Service) {
        docker compose logs -f --tail=100 $Service
    }
    else {
        docker compose logs -f --tail=100
    }
}

function Get-Status {
    Write-Step "Service Status:"
    Write-Host ""
    Set-Location $ProjectRoot
    docker compose ps
}

function Build-Images {
    Write-Header
    Write-Step "Building Docker images..."

    if (-not (Test-Docker)) { exit 1 }
    Test-EnvFile

    Set-Location $ProjectRoot
    docker compose build --no-cache --parallel

    Write-Success "Images built successfully!"
}

function Clear-All {
    Write-Header
    Write-Step "Cleaning up Docker resources..."

    $confirm = Read-Host "This will remove all containers and volumes. Are you sure? (y/N)"

    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        Set-Location $ProjectRoot
        docker compose down -v --remove-orphans
        docker image prune -f
        Write-Success "Cleanup complete!"
    }
    else {
        Write-Info "Cleanup cancelled"
    }
}

function Start-Dev {
    Write-Header
    Write-Step "Starting development infrastructure..."

    if (-not (Test-Docker)) { exit 1 }

    Set-Location $ProjectRoot
    docker compose -f docker-compose.dev.yml up -d

    Write-Host ""
    Write-Success "Development infrastructure started!"
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "Infrastructure Services:" -ForegroundColor Green
    Write-Host "  MongoDB:     mongodb://localhost:27017" -ForegroundColor Blue
    Write-Host "  DragonflyDB: redis://localhost:6379" -ForegroundColor Blue
    Write-Host "  MinIO API:   http://localhost:9000" -ForegroundColor Blue
    Write-Host "  MinIO UI:    http://localhost:9001" -ForegroundColor Blue
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Info "Run your applications locally:"
    Write-Host "  cd frontend; npm run dev"
    Write-Host "  cd backend; npm run start:dev"
    Write-Host ""
    Write-Host "Connection Strings for .env:" -ForegroundColor Yellow
    Write-Host "  DATABASE_URL=mongodb://cmsuser:cmspassword123@localhost:27017/cms?authSource=cms"
    Write-Host "  REDIS_URL=redis://localhost:6379"
    Write-Host "  AWS_S3_ENDPOINT=http://localhost:9000"
}

function Stop-Dev {
    Write-Header
    Write-Step "Stopping development infrastructure..."

    Set-Location $ProjectRoot
    docker compose -f docker-compose.dev.yml down

    Write-Success "Development infrastructure stopped!"
}

function Test-Health {
    Write-Header
    Write-Step "Checking service health..."
    Write-Host ""

    # Backend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Success "Backend is healthy"
        Write-Host $response.Content.Substring(0, [Math]::Min(200, $response.Content.Length))
    }
    catch {
        Write-Error "Backend is not responding"
    }

    # Frontend
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:$FrontendPort/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Success "Frontend is healthy"
    }
    catch {
        Write-Error "Frontend is not responding"
    }

    # MongoDB
    try {
        $result = docker exec cms-mongodb mongosh --quiet --eval "db.adminCommand('ping')" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "MongoDB is healthy"
        } else {
            Write-Error "MongoDB is not responding"
        }
    }
    catch {
        Write-Error "MongoDB is not responding"
    }

    # DragonflyDB
    try {
        $result = docker exec cms-dragonfly redis-cli ping 2>&1
        if ($result -match "PONG") {
            Write-Success "DragonflyDB is healthy"
        } else {
            Write-Error "DragonflyDB is not responding"
        }
    }
    catch {
        Write-Error "DragonflyDB is not responding"
    }

    # MinIO
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        Write-Success "MinIO is healthy"
    }
    catch {
        Write-Error "MinIO is not responding"
    }
}

function Get-Shell {
    $svc = if ($Service) { $Service } else { "backend" }
    Write-Info "Opening shell in $svc container..."
    Set-Location $ProjectRoot
    docker compose exec $svc sh
}

function Show-Help {
    Write-Header
    Write-Host "Usage: .\deploy.ps1 [command] [service]"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  start       Start all services (production)"
    Write-Host "  stop        Stop all services"
    Write-Host "  restart     Restart all services"
    Write-Host "  logs        View logs (optionally specify service)"
    Write-Host "  status      Show service status"
    Write-Host "  build       Build Docker images (no cache)"
    Write-Host "  clean       Remove containers and volumes"
    Write-Host "  shell       Open shell in container (default: backend)"
    Write-Host "  dev         Start development infrastructure only"
    Write-Host "  dev-stop    Stop development infrastructure"
    Write-Host "  health      Check all service health"
    Write-Host "  help        Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 start              # Start all services"
    Write-Host "  .\deploy.ps1 logs backend       # View backend logs"
    Write-Host "  .\deploy.ps1 shell mongodb      # Open MongoDB shell"
    Write-Host "  .\deploy.ps1 dev                # Start DB/Cache/Storage for local dev"
}

# Main
switch ($Command.ToLower()) {
    "start"     { Start-Services }
    "stop"      { Stop-Services }
    "restart"   { Restart-Services }
    "logs"      { Get-Logs }
    "status"    { Get-Status }
    "build"     { Build-Images }
    "clean"     { Clear-All }
    "shell"     { Get-Shell }
    "dev"       { Start-Dev }
    "dev-stop"  { Stop-Dev }
    "health"    { Test-Health }
    default     { Show-Help }
}
