Struttura cartelle
-barber-Proxy -> certs docker-compose nginx/nginx.conf
-barber-be -> tutto il be

-------------------------------------------

docker-compose: 
services:
  barber-be:
    build:
      context: ../frankenstylebarber    # percorso della cartella del Dockerfile
      dockerfile: Dockerfile            
    container_name: barber-be
    restart: unless-stopped
    ports:
      - "8080:8080"
    networks:
      - barber-net

  nginx:
    image: nginx:latest
    container_name: barber-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs/fullchain3.pem:/etc/ssl/certs/fullchain.pem:ro
      - ./certs/_.frankenstylebarber.it_private_key.key:/etc/ssl/private/_.frankenstylebarber.it_private_key.key:ro
    networks:
      - barber-net

networks:
  barber-net:
    driver: bridge

-----------------------------

nginx.conf:

user nginx;
worker_processes auto;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    # Server HTTPS
    server {
        listen 443 ssl http2;
        server_name api.frankenstylebarber.it;

        ssl_certificate     /etc/ssl/certs/fullchain.pem;
        ssl_certificate_key /etc/ssl/private/_.frankenstylebarber.it_private_key.key;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://barber-be:8080;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    }

    # Redirect HTTP → HTTPS
    server {
        listen 80;
        server_name api.frankenstylebarber.it;
        return 301 https://$host$request_uri;
    }
}

