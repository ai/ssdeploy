FROM nginx:alpine
RUN rm -R /etc/nginx/conf.d
COPY ./dist/ /var/www/
COPY ./node_modules/solid-state-deploy/nginx.conf /etc/nginx/nginx.template
COPY ./nginx.conf /etc/nginx/server.conf
CMD envsubst \$PORT < /etc/nginx/nginx.template > /etc/nginx/nginx.conf && nginx
