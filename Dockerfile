FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm install --omit=dev

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--port", "4173", "--host"]
