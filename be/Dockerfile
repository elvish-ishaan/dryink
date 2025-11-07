FROM node:20-alpine

WORKDIR /app

#copy the package.json file and install the dependencies of be
COPY package*.json ./


RUN npm install

#now copy the db folder and install the dependencies of db
RUN cd ../db
RUN npm install 

COPY . ./db

COPY . .

EXPOSE 8080

CMD ["npm","run", "start"]