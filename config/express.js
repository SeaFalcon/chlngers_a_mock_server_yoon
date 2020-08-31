const express = require('express');
const compression = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');

// Add Swagger
const { swaggerSpec, swaggerUi } = require('./swagger');

const indexRoute = require('../src/app/routes/indexRoute');
const userRoute = require('../src/app/routes/userRoute');

module.exports = () => {
  const app = express();

  app.use(compression());

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  app.use(methodOverride());

  app.use(cors());
  // app.use(express.static(process.cwd() + '/public'));

  // swagger 처리
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  /* App (Android, iOS) */
  indexRoute(app);
  userRoute(app);

  /* Web */
  // require('../src/web/routes/indexRoute')(app);

  /* Web Admin */
  // require('../src/web-admin/routes/indexRoute')(app);
  return app;
};
