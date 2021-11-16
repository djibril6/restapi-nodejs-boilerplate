# Node.js Rest API boilerplate
[![Coverage Status](https://coveralls.io/repos/github/djibril6/restapi-nodejs-boilerplate/badge.svg?branch=main)](https://coveralls.io/github/djibril6/restapi-nodejs-boilerplate?branch=main)
[![Build Status](https://app.travis-ci.com/djibril6/restapi-nodejs-boilerplate.svg?branch=main)](https://app.travis-ci.com/djibril6/restapi-nodejs-boilerplate)

Node.js, express, Typescript and mongoDB project boilerplate

## Installation with `create-nodejs-boilerplate`

```bash

npx create-nodejs-boilerplate <project-name> --template RestAPI

```
## Manual installation

Clone the repository:
```bash

git clone https://github.com/djibril6/restapi-nodejs-boilerplate.git
# Then
npx rimraf ./.git

```

Then create a new `.env` file in the project root directory and copy the .env.exemple file content (this step not necessary in the project in installed with `create-node-js-boilerplate`).

Install the dependencies for the project:
```bash

npm install

```

### Environnement variables

Edit the `.env` file by adding the corrects value for each field. 

## Features used in this project

- **NoSQL database**: [MongoDB](https://www.mongodb.com) object data modeling using [Mongoose](https://mongoosejs.com)
- **Email service**: Email API service [Sendgrid](https://sendgrid.com)
- **Validation**: request data validation using [Joi](https://github.com/hapijs/joi)
- **Logging**: using [winston](https://github.com/winstonjs/winston) and [morgan](https://github.com/expressjs/morgan)
- **Testing**: unit and integration tests using [Jest](https://jestjs.io)
- **Error handling**: centralized error handling mechanism
- **API documentation**: with [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) and [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
- **Process management**: advanced production process management using [PM2](https://pm2.keymetrics.io)
- **Security**: set security HTTP headers using [helmet](https://helmetjs.github.io)
- **Santizing**: sanitize request data against xss and query injection
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)
- **Compression**: gzip compression with [compression](https://github.com/expressjs/compression)
- **CI**: continuous integration with [Travis CI](https://travis-ci.org)
- **Docker support**
- **Code coverage**: using [coveralls](https://coveralls.io)
- **Code quality**: with [Codacy](https://www.codacy.com)
- **Git hooks**: with [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged)
- **Linting**: with [ESLint](https://eslint.org) and [Prettier](https://prettier.io)
- **Editor config**: consistent editor configuration using [EditorConfig](https://editorconfig.org)

## Project Structure

```
src\
 |--config\         # Environment variables and global configurations 
 |--controllers\    # All Route controllers
 |--middlewares\    # All Custom express middlewares
 |--models\         # All Mongoose models
 |--routes\         # RestFull Api Routes 
 |--services\       # All database query and services(Business logic)
 |--types\          # All TypeScript shared interfaces and enums
 |--utils\          # Utility classes and functions
 |--validations\    # All data validation logics
 |--server.ts       # Express app
 |--index.ts        # App entry point
test\
 |--integration\    # integration test files
 |--utils\          # utilty functions for test
```
## API Documentation

In development mode and go to `http://localhost:{PORT}/v1/docs` in your browser. 

## Authentication

We are using an access and refresh token system.

## Logging

Logging should be done with the logger module (`do not use console.log()`) located in `src/config/logger.js`, according to the following severity levels:

```javascript
import { config, logger } from '<path to src>/config';

logger.error('message'); // level 0
logger.warn('message'); // level 1
logger.info('message'); // level 2
logger.http('message'); // level 3
logger.verbose('message'); // level 4
logger.debug('message'); // level 5
```

## Inspirations

- Inspired from [hagopj13/node-express-boilerplate](https://github.com/djibril6/restapi-nodejs-boilerplate) project.
- The javascript [hagopj13/node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate) project.
