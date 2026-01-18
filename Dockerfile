# 1. Imagen base ligera de Node
FROM node:18-alpine

# 2. Crear directorio de trabajo
WORKDIR /app

# 3. Copiar archivos de dependencias
COPY package*.json ./

# 4. Instalar dependencias de producción
RUN npm install --production

# 5. Copiar el resto del código (El .dockerignore excluirá futnion-react)
COPY . .

# 6. Exponer el puerto (Verifica en tu server.js qué puerto usas. Usualmente 3000 o 5000)
EXPOSE 3000

# 7. Comando para iniciar
CMD ["node", "server.js"]