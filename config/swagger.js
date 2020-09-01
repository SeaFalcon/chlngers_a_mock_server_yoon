const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
// You can set every attribute except paths and swagger
// https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md
const swaggerDefinition = {
  info: { // API informations (required)
    title: 'Challengers', // Title (required)
    version: '1.0.0', // Version (required)
    description: 'Challengers App API', // Description (optional)
  },
  host: 'localhost:3000', // Host (optional)
  basePath: '/', // Base path (optional)
  securityDefinitions: {
    jwt: {
      type: 'apiKey',
      name: 'x-access-token',
      in: 'header',
    },
  },
  security: [
    { jwt: [] },
  ],
};

// Options for the swagger docs
const options = {
  // Import swaggerDefinitions
  swaggerDefinition,
  // Path to the API docs
  apis: [
    // './src/app/controllers/userController.js',
    // './src/app/userSchema/users.yaml',
    './src/app/api-docs/users/*.yaml',
  ],
};

// Initialize swagger-jsdoc -> returns validated swagger spec in json format
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi,
};
