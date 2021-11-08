import mongoose from 'mongoose';
import app from './app';
import { config, logger } from './config';


mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
  app.listen(config.port, () => {
    logger.info(`🚀 Server listening to port ${config.port}`);
  });
});
