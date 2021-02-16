const {parentPort: parent} = require('worker_threads');

const {internet, random} = require('faker');
const fs = require('fs');
const phin = require('phin');

const account = fs.createWriteStream('./accounts.txt', {flags: 'a+'});

parent.on('message', async token => {
    const user_agent = internet.userAgent();

    const username = get_username();
    const email = internet.email();
    const password = internet.password();

    const page_1_response = await page_1(user_agent);
    if (page_1_response !== 'success=1') return parent.postMessage(await get_error(page_1_response));

    const page_2_response = await page_2(user_agent, username);
    if (!page_2_response.startsWith('success=1')) return parent.postMessage(await get_error(page_2_response));

    const sid = page_2_response.split('=')[2];
    const page_3_response = await page_3(user_agent, token, email, password, sid);
    if (!page_3_response.startsWith('success=1')) return parent.postMessage(await get_error(page_3_response));

    account.write(`${username}:${password}\n`);
    return parent.postMessage(`Registered account ${username} to penglyfe.`);
});

async function page_1(agent) {
    const payload = {
        lang: 'en',
        affiliate: 0,
        agree_to_terms: 1,
        agree_to_rules: 1,
        action: 'validate_agreement'
    }
    const {body} = await send_request({'User-Agent': agent}, payload);
    return body.toString();
}

async function page_2(agent, username) {
    const payload = {
        lang: 'en',
        username: username,
        colour: 4,
        action: 'validate_username'
    }
    const {body, headers} = await send_request({'User-Agent': agent}, payload);

    this.cookie = headers['set-cookie'][1].split(' ')[0] + ' cpvisitor=returnpaid'; // session
    return body.toString();
}

async function page_3(agent, token, email, password, sid) {
    const payload = {
        lang: 'en',
        gtoken: token,
        email: email,
        password_confirm: password,
        password: password,
        action: 'validate_password_email',
        sid: sid
    }
    const {body} = await send_request({'User-Agent': agent, 'Cookie': this.cookie}, payload);
    return body.toString();
}

async function get_error(error) {
    return error.split('error=')[1].split('+').join(' ')
}

function get_username() {
    let username = internet.userName();
    username = username.replace(/[^A-Za-z0-9]/g, '');
    if (username.length < 3) username = username + 'ak' + random.number({min: 10, max: 99});
    else if (username.length > 12) username = username.slice(0, 12 - 1);
    return username;
}

async function send_request(header, payload) {
    return phin({
        method: 'POST',
        url: 'https://play.penglyfe.com/create_account/create_account.php',
        headers: header,
        form: payload
    });
}