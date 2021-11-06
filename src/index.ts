import app from './app';
import { config, logger } from './config';


const server = app.listen(config.port, () => {
  logger.info(`🚀 Server listening to port ${config.port}`);
});
