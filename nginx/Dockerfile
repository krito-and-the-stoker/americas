FROM nginx:1.25.3-alpine

# Add Community Repository for Certbot
RUN echo "http://dl-cdn.alpinelinux.org/alpine/v3.19/community" >> /etc/apk/repositories

# Update apk and install Certbot
RUN apk update && \
    apk add --no-cache certbot certbot-nginx

RUN mkdir -p /var/www/certbot

COPY ./create-certificates.sh /bin/create-certificates.sh
RUN chmod a+x /bin/create-certificates.sh

COPY ./renew-certificates.sh /bin/renew-certificates.sh
RUN chmod a+x /bin/renew-certificates.sh

# Copy the nginx configuration file
COPY ./default.conf /etc/nginx/conf.d/default.conf
