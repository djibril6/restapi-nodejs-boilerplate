/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */
import ncp from 'ncp';
import { promisify } from 'util';

const copy = promisify(ncp);

async function copyFiles(source, destination) {
  return copy(source, destination);
};

copyFiles('.env','./dist/.env');