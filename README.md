# Solid State Deploy

Deploy simple websites with Google Cloud and Cloudflare.
It is like Netlify with:

* **Better performance.** Cloudflare has more features for fast websites
  than Netlify CDN. For instance, HTTP/3 and TLS 1.3 0-RTT.
* **Flexibility.** You can have crontab jobs and simple scripts
  (without persistence storage). You will have powerful and well documented
  Nginx config to define custom headers and redirects.
* **Lack of vendor lock-in.** We use industry standards like Docker
  and Nginx. You can change CI, CDN, or Docker cloud separately.
* **Local tests.** You can run a server on your laptop to test redirects
  and scripts.

You will have built-in HTTPS and deploy by `git push`.

We also have trade-offs. It is not free, but for a simple website,
it will cost you cents per month. You need more steps to install it,
but after you have the same simple workflow.

<a href="https://evilmartians.com/?utm_source=ssdeploy">
  <img src="https://evilmartians.com/badges/sponsored-by-evil-martians.svg"
       alt="Sponsored by Evil Martians" width="236" height="54">
</a>

## Install

1. Create an account in [Google Cloud].
2. Go to **IAM & Admin** → **Service Accounts**,
   click **Create Service Account** and fill form:
   * Service Account Name: `github-actions`
   * Service Account Description: `Deploy from GitHub Actions`
3. Add **Cloud Run Admin**, **Storage Admin**, **Service Account User** roles.
4. Click **Create Key**, choose **JSON** → **Create**, download and keep
   file for a while.
5. Open **Container Registry** and enable the service.
6. Open **Cloud Run** and start the service.
7. Go to your GitHub page of your project at **Settings** → **Secrets**.
8. Add new secret `GCLOUD_PROJECT` with Google Cloud project name like
   `test-255417`. You can find project ID by opening a project switcher
   at the top of [Google Cloud].
9. Choose application name (like `testcom`) and add `GCLOUD_APP` secret with
   this name.
10. Call `base64 key-partition-….json` (file from step 4) and add `GCLOUD_AUTH`
    secret with the base64 content of this file.
11. Install Solid State Deploy to your project.

    ```sh
    npm i ssdeploy
    ```
12. Create GitHub Actions workflow by calling:

    ```sh
    npx ssdeploy init
    ```
13. Your project should build HTML files by `npm build` and put them to `dist/`.
14. Push the project’s changes to GitHub Actions to start deploying.
    Open **Actions** tab on GitHub to check out the process.
15. Go to **Cloud Run** at [Google Cloud] and find your server. Open it
    by clicking on the name and find URL like `testcom-hjv54hv.a.run.app`.
    Check that the website is working.
16. Click on **Manage Custom Domains** → **Add mapping**. Select your app,
    **Verify a new domain**, and enter your domain name.
    Finish domain verification with Webmaster Central.
17. After verification open **Add mapping** dialog again, select your app,
    domain, and leave subdomain blank. You will get `A` and `AAAA` records.
18. Create a new [Cloudflare] account.
    Create a site with `A` and `AAAA` records from Cloud Run.
19. Enable **HTTP/3** and **0-RTT** in Cloudflare **Network** settings.
20. Find **Zone ID** at site overview and create **API token**
    with `cache cleaner` name and `Cache Purge`/`Edit` permission.
21. Use them in `CLOUDFLARE_ZONE` and `CLOUDFLARE_TOKEN` secrets at GitHub.
22. Go to Google Cloud Run, **Manage Custom Domains** → **Add mapping**
    to add `www` subdomain and add `CNAME` record to Cloudflare **DNS**
    settings.

We recommend to check final result
[for blocking in Russia](https://isitblockedinrussia.com/) and recreate
Cloudflare account to change IP addressed.

Few extra steps will improve security:

1. Go to Cloudflare **SSL/TLS** settings and enable **Full** encryption mode.
2. Add `CAA` records to Cloudflare **DNS** settings:

   ```js
   CAA @   0 "only allow specific hostname" digicert.com
   CAA @   0 "only allow specific hostname" letsencrypt.org
   CAA www 0 "only allow specific hostname" digicert.com
   CAA www 0 "only allow specific hostname" letsencrypt.org
   ```
3. Enable **DNSSEC** in **DNS** settings.
4. Enable **HTST** by creating `nginx.conf` in the root of your project with:

   ```cpp
   add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
   add_header X-Content-Type-Options "nosniff";
   ```

[Google Cloud]: https://console.cloud.google.com/
[Cloudflare]: https://www.cloudflare.com/


## Deploy

Just push commits to `master`:

```sh
git push origin master
```

You can switch deploy branch at `.github/workflows/deploy.yml`.


## Run Server Locally

To test the Docker image locally run:

```sh
npm build
npx ssdeploy run
```

## Deploy Server Locally

You can deploy a server from the laptop. It can be useful to debug.

You need to install [Google Cloud SDK](https://cloud.google.com/sdk/install)
and call:

```sh
npx ssdeploy deploy
```


## Custom Nginx config

In custom Nginx config, you can define headers and redirects. Create `nginx.conf`
in your project root.

```cpp
if ($host ~ ^www\.(?<domain>.+)$) {
  return 301 https://$domain$request_uri;
}

location ~* "(\.css|\.png|\.svg|\.woff2)$" {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

It will be included inside the `server` context.


## Custom Docker config

Custom `Dockerfile` should be placed at your project root. It can be used
to define crontab jobs:

```sh
FROM nginx:alpine
RUN rm -R /etc/nginx/conf.d
COPY ./dist/ /var/www/
COPY ./node_modules/ssdeploy/nginx.conf /etc/nginx/nginx.template
COPY ./nginx.conf /etc/nginx/server.conf
RUN echo "#\!/bin/sh\necho 1" > /etc/periodic/hourly/example
RUN chmod a+x /etc/periodic/hourly/example
CMD crond && envsubst \$PORT < /etc/nginx/nginx.template > /etc/nginx/nginx.conf && nginx
```
