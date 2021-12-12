FROM nginx:alpine
RUN rm -R /etc/nginx/conf.d
COPY ./nginx-template.conf /etc/nginx/nginx.template
COPY ./nginx.conf /etc/nginx/server.conf
COPY ./dist/ /var/www/
CMD envsubst \$PORT < /etc/nginx/nginx.template > /etc/nginx/nginx.conf && nginx
