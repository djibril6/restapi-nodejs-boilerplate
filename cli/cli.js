const util = require('util');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
import arg from 'arg';
import inquirer from 'inquirer';

const templateValues = ["RestAPI", "graphQL"];
const repo = 'https://github.com/djibril6/awsome-nodejs-bolerplate.git';

// Utility functions
const exec = util.promisify(require('child_process').exec);
async function runCmd(command) {
  try {
    const { stdout, stderr } = await exec(command);
    console.log(stdout);
    console.log(stderr);
  } catch {
    (error) => {
      console.log(error);
    };
  }
}

async function hasYarn() {
  try {
    await execSync('yarnpkg --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getArguments(rawArgs) {
    const args = arg(
      {
        '--template': String,
        '-t': '--template',
      },
      {
        argv: rawArgs.slice(2),
      }
    );
    return {
      appName: args._[0],
      template: args['--template'] || templateValues[0],
    };
}


async function validateArguments(options) {
    const questions = [];
    if (!options.appName) {
      questions.push({
        type: 'string',
        name: 'appName',
        message: 'Please specify a name for your project',
      });
    }

    if (options.template && !templateValues.includes(options.template)) {
        questions.push({
          type: 'list',
          name: 'template',
          message: 'Please choose a correct template value',
          choices: templateValues,
          default: templateValues[0],
        });
      }
   
    const answers = await inquirer.prompt(questions);
    return {
      ...options,
      appName: answers.appName || options.appName,
      template: answers.template || options.template
    };
}

function isDirectoryExist(appPath) {
    try {
        fs.mkdirSync(appPath);
      } catch (err) {
        if (err.code === 'EEXIST') {
          console.log('Directory already exists. Please choose another name for the project.');
        } else {
          console.log(err);
        }
        process.exit(1);
      }
}

async function setup(appPath, folderName) {
  try {
    // Clone the repo
    console.log(`Downloading project files from ${repo}`);
    await runCmd(`git clone --depth 1 ${repo} ${folderName}`);
    console.log('');

    // Change directory
    process.chdir(appPath);

    fs.unlinkSync(path.join(appPath, 'package-lock.json'));

    // Install dependencies
    const useYarn = await hasYarn();
    console.log('Installing dependencies...');
    if (useYarn) {
      await runCmd('yarn install');
    } else {
      await runCmd('npm install');
    }
    console.log('Dependencies installed.');
    console.log();

    // Copy envornment variables
    fs.copyFileSync(path.join(appPath, '.env.example'), path.join(appPath, '.env'));
    console.log('Environment files copied.');

    // Delete .git folder
    await runCmd('npx rimraf ./.git');

    // Remove extra files
    // fs.unlinkSync(path.join(appPath, 'bin', 'create-nodejs-boilerplate.js'));
    // fs.rmdirSync(path.join(appPath, 'bin'));
    // fs.unlinkSync(path.join(appPath, 'cli', 'cli.js'));
    // fs.rmdirSync(path.join(appPath, 'cli'));
    if (!useYarn) {
      fs.unlinkSync(path.join(appPath, 'yarn.lock'));
    }

    // Remove unused packages
    console.log('Removing unused packages...');
    if (useYarn) {
        await runCmd('yarn remove inquirer');
        await runCmd('yarn remove arg');
        await runCmd('yarn remove esm');
    } else {
        await runCmd('npm uninstall inquirer');
        await runCmd('npm uninstall arg');
        await runCmd('npm uninstall esm');
    }
    console.log('Packages removed.');

    console.log('Installation completed!');
    console.log();

    console.log('Start by typing:');
    console.log(`    cd ${folderName}`);
    console.log(useYarn ? '    yarn dev' : '    npm run dev');
    console.log();
    console.log('Happy coding!!!');
  } catch (error) {
    console.log(error);
  }
}

export async function cli(args) {
    let options = getArguments(args);
    options = await validateArguments(options);

    // Define constants
    const ownPath = process.cwd();
    const folderName = options.appName;
    const appPath = path.join(ownPath, folderName);

    isDirectoryExist(appPath);

    setup(appPath, folderName);
}