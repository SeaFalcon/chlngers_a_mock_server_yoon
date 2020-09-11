require('dotenv').config();

const express = require('express');
const compression = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');

// file upload
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const AWS = require('aws-sdk');

// Add Swagger
const { swaggerSpec, swaggerUi } = require('./swagger');

const indexRoute = require('../src/app/routes/indexRoute');
const userRoute = require('../src/app/routes/userRoute');
const challengeRoute = require('../src/app/routes/challengeRoute');
const friendRoute = require('../src/app/routes/friendRoute');
const feedRoute = require('../src/app/routes/feedRoute');
const fileUploadRouter = require('../src/app/routes/fileUploadRouter');

module.exports = () => {
  const app = express();

  app.use(compression());

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  app.use(methodOverride());

  app.use(cors());
  // app.use(express.static(process.cwd() + '/public'));

  // aws-s3 upload
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
    region: 'ap-northeast-2',
  });

  const s3 = new AWS.S3();

  const upload = multer({
    storage: multerS3({
      s3,
      bucket: 'chlngersimage',
      key(req, file, cb) {
        const extension = path.extname(file.originalname);
        cb(null, Date.now().toString() + extension);
      },
      acl: 'public-read-write',
    }),
    // limits: { fileSize: 5 * 1024 * 1024 },
  });

  // const upload = multer({ dest: 'upload/' });
  // app.use('/image', express.static('upload'));

  // swagger 처리
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.set('views', './src/app/views');
  app.set('view engine', 'ejs');

  /* App (Android, iOS) */
  indexRoute(app);
  userRoute(app);
  challengeRoute(app);
  friendRoute(app);
  feedRoute(app);
  fileUploadRouter(app, upload);

  /* Web */
  // require('../src/web/routes/indexRoute')(app);

  /* Web Admin */
  // require('../src/web-admin/routes/indexRoute')(app);
  return app;
};
