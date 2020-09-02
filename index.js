const express = require('./config/express');
const { logger } = require('./config/winston');

const port = 3000;
express().listen(port);
logger.info(`${process.env.NODE_ENV} - API Server Start At Port ${port}`);

// const fs = require('fs');
// const https = require('https');
// const express = require('./config/express');

// const { logger } = require('./config/winston');

// const options = { // letsencrypt로 받은 인증서 경로를 입력해 줍니다.
//   ca: fs.readFileSync('/etc/letsencrypt/live/falconsea.shop/fullchain.pem'),
//   key: fs.readFileSync('/etc/letsencrypt/live/falconsea.shop/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/falconsea.shop/cert.pem'),
// };

// https.createServer(options, express()).listen(443);
// logger.info(`${process.env.NODE_ENV} - API Server Start At Port ${port}`);

// /*
// listen [::]:443 ssl ipv6only=on; # managed by Certbot
// listen 443 ssl; # managed by Certbot
// ssl_certificate /etc/letsencrypt/live/falconsea.shop/fullchain.pem; # managed by Certbot
// ssl_certificate_key /etc/letsencrypt/live/falconsea.shop/privkey.pem; # managed by Certbot
// include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
// ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
// */
