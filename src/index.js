const {Worker: Thread} = require('worker_threads');

const logger = require('./utils/logger');
const phin = require('phin');

const harvester = "harvester recaptcha-v3 -a login -k 6LfF6ykaAAAAAEfdH7rsE-7UrXaVY9T_IHfJ5MMd -d play.penglyfe.com";
const spawn = require("child_process").spawn;
const workerScriptFilePath = require.resolve('./workers/create-account.js');

let threads = {};
let is_started = false;
let is_windows = process.platform === 'win32';

if (is_windows) spawn("powershell.exe", [harvester]);
global.logger = logger;

setInterval(async () => {
    try {
        const {body, statusCode} = await phin('http://127.0.0.1:5000/play.penglyfe.com/token');
        if (!is_started) {
            logger.info('Connected to recaptcha-V3 Harvester.');
            is_started = true;
        }

        if (statusCode === 418) return;
        const token = body.toString();
        logger.info('Received token from harvester...');

        threads[token] = new Thread(workerScriptFilePath);

        threads[token].on('message', async output => {
            logger.info(`Thread [ID: ${token.slice(-5)}] received : ${output}`);
            await threads[token].terminate();
        });
        threads[token].on('error', error => logger.error(error));
        threads[token].on('exit', () => logger.info(`Thread [ID: ${token.slice(-5)}] has been closed.`));

        threads[token].postMessage(token);
    } catch (e) {
        logger.warn(e.toString());
        if (is_started === true) {
            logger.info('Harvester closed, shutting down...');
            process.exit();
        }

        if (is_windows) return logger.info('Connecting to recaptcha harvester, please wait...');
        logger.info('Please start recaptcha harvester.');
    }
}, 500);