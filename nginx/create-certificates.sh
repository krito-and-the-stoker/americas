#!/bin/sh

# Configuration variables
DOMAIN="play-americas.com"
SUBDOMAINS="www.play-americas.com wiki.play-americas.com dashboard.play-americas.com"
EMAIL="public@krito.de"
WEBROOT_PATH="/usr/share/nginx/html"

# Prepare the -d options for Certbot
DOMAINS_OPTION="-d $DOMAIN"
for SUBDOMAIN in $SUBDOMAINS; do
    DOMAINS_OPTION="$DOMAINS_OPTION -d $SUBDOMAIN"
done

# Run Certbot
certbot certonly --webroot -w $WEBROOT_PATH $DOMAINS_OPTION --email $EMAIL --agree-tos --no-eff-email

tail -n 100 /var/log/letsencrypt/letsencrypt.log