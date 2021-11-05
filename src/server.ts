import express from 'express';
import cors from 'cors';
import { Server } from 'http';
import helmet from 'helmet';
import xss from 'xss-clean';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';

import { config, logger } from './config';
import { ENodeEnv } from './types';

const startServer  = async (): Promise<Server> => {
  
    const app = express();

    // set security HTTP headers
    if (config.env === ENodeEnv.PROD) {
        app.use(helmet());
    }

    // parse json request body
    app.use(express.json());

    // parse urlencoded request body
    app.use(express.urlencoded({ extended: true }));

    // sanitize request data
    app.use(xss());
    app.use(mongoSanitize());

    // gzip compression
    app.use(compression());

    // enable cors
    app.use(cors());
    app.options('*', cors());

  

    /**
     * TODO -- send back a 404 error for any unknown api request
     */

    const server = await app.listen(config.port, () => {
        logger.info(`🚀 Server listening to port ${config.port}`);
    });
    return server;
};

export default startServer;
