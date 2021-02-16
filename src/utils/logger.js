const chalk = require('chalk');

const info = msg => {
    console.log(chalk`{grey [${getTime()}]} {blue [INFO] >>} ${msg}`);
}

const error = msg => {
    console.log(chalk`{grey [${getTime()}]} {red [ERROR] >>} ${msg}`);
}

const warn = msg => {
    console.log(chalk`{grey [${getTime()}]} {yellow [WARN] >>} ${msg}`);
}

module.exports = {info, error, warn};

function getTime() {
    const date = new Date
    return date.toLocaleTimeString();
}
