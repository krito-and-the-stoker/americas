#!/bin/sh

# Configuration variables
EMAIL="public@krito.de"
WEBROOT_PATH="/var/www/certbot"

# Renewing the certificate
certbot renew --webroot -w $WEBROOT_PATH --email $EMAIL --agree-tos --no-eff-email

# Reload Nginx to apply the renewed certificate (optional, uncomment if needed)
nginx -s reload
