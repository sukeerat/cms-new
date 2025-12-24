#!/bin/bash

# ===========================================
# SSL Certificate Setup Script
# ===========================================
# Usage: ./scripts/setup-ssl.sh your-domain.com your-email@example.com

set -e

DOMAIN="${1:-}"
EMAIL="${2:-}"
INSTALL_DIR="${3:-/opt/cms}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_info() { echo -e "${YELLOW}→ $1${NC}"; }
log_error() { echo -e "${RED}✗ $1${NC}"; }

# Validate inputs
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 cms.example.com admin@example.com"
    exit 1
fi

cd "$INSTALL_DIR"

echo ""
echo "Setting up SSL for: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Step 1: Make sure containers are running
log_info "Ensuring containers are running..."
docker compose -f docker-compose.prod.yml up -d nginx certbot

sleep 5

# Step 2: Request certificate
log_info "Requesting SSL certificate..."

docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [ $? -ne 0 ]; then
    log_error "Failed to obtain SSL certificate"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Make sure DNS points to this server"
    echo "2. Make sure port 80 is accessible"
    echo "3. Try again in a few minutes"
    exit 1
fi

log_success "SSL certificate obtained!"

# Step 3: Update nginx configuration
log_info "Updating Nginx configuration..."

cat > "$INSTALL_DIR/nginx/conf.d/default.conf" << EOF
# ===========================================
# CMS Production Configuration with SSL
# Domain: ${DOMAIN}
# Generated: $(date)
# ===========================================

# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS - Main server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;

    # SSL Configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Include location blocks
    include /etc/nginx/snippets/locations.conf;
}

# Redirect www to non-www (optional - uncomment if needed)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name www.${DOMAIN};
#
#     ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
#
#     return 301 https://${DOMAIN}\$request_uri;
# }
EOF

# Step 4: Test and reload nginx
log_info "Testing Nginx configuration..."
docker compose -f docker-compose.prod.yml exec nginx nginx -t

log_info "Reloading Nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

# Step 5: Setup auto-renewal cron
log_info "Setting up auto-renewal..."

# Add cron job for certificate renewal
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 3 * * * cd $INSTALL_DIR && docker compose -f docker-compose.prod.yml run --rm certbot renew --quiet && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload") | crontab -

log_success "Auto-renewal configured (runs daily at 3 AM)"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}  SSL Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "  Your site is now available at:"
echo "    https://${DOMAIN}"
echo ""
echo "  Certificate will auto-renew before expiry."
echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
