# ==========================================
# FASE 1: Build dell'applicazione con Node
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Sostituisci "build" con "dist" se usi Vite
RUN npm run dist 

# ==========================================
# FASE 2: Server di produzione con Nginx
# ==========================================
FROM nginx:alpine

# 1. Rimuove la configurazione di default di Nginx
RUN rm /etc/nginx/conf.d/default.conf

# 2. Copia il nostro file di configurazione personalizzato
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 3. Rimuove i file HTML di default di Nginx
RUN rm -rf /usr/share/nginx/html/*

# 4. Copia i file compilati dalla FASE 1.
# Assicurati di usare il percorso giusto (/app/build per CRA, /app/dist per Vite)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]