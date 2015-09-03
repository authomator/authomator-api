FROM node:0.12.7

WORKDIR /site

ADD package.json /site/
RUN npm install --production
ADD . /site/

ENV NODE_ENV=production
ENTRYPOINT ["npm", "start"]
EXPOSE 9000