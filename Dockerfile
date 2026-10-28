FROM node:20
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y git
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
