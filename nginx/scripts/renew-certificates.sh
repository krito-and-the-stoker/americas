#!/bin/sh

# Configuration variables
EMAIL="public@krito.de"
WEBROOT_PATH="/usr/share/nginx/html"

# Renewing the certificate
certbot renew --webroot -w $WEBROOT_PATH --email $EMAIL --agree-tos --no-eff-email

# Reload Nginx to apply the renewed certificate (optional, uncomment if needed)
nginx -s reload

# usage:
# docker exec live-webserver-1 renew-certificates.sh