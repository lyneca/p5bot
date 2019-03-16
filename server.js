const server = require('server');
const axios = require('axios')
const FormData = require('form-data')

const { get, post, error } = server.router;
const { status } = server.reply;

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')

const botRequester = axios.create({
    headers: {
        "Authorization": "Bearer " + process.env.BOT_TOKEN
    }
});

const userRequester = axios.create({
    headers: {
        "Authorization": "Bearer " + process.env.USER_TOKEN
    }
});

function react(timestamp, channel, name) {
    botRequester.post(
        'https://slack.com/api/reactions.add',
        {
            name: name,
            channel: channel,
            timestamp: timestamp
        }
    )
        .then(r => console.log(r.data))
        .catch(e => console.log(e));
}

function sendImage(thread_ts, channel, path) {
    const fd = new FormData()

    fd.append('channels', channel);
    fd.append('token', process.env.BOT_TOKEN);
    fd.append('thread_ts', thread_ts);
    fd.append('filetype', 'gif');
    fd.append('file', fs.createReadStream(path))

    return botRequester.post(
        "https://slack.com/api/files.upload",
        fd, { headers: fd.getHeaders() }
    );
}

function getID() {
    return 'render_' + new Date().getTime()
}

function gif(ctx) {
    const file = '/tmp/renders/' + ctx.query.id;

    if (fs.existsSync(file)) return fs.readFileSync(file)
    return status(404);
}

function getThreadParent(thread_ts, channel) {
    return userRequester.get(
        'https://slack.com/api/channels.history',
        {
            params: {
                channel: channel,
                latest: thread_ts,
                count: 1,
                inclusive: true
            }
        }
    ).then(request => {
        return request.data.messages[0].files[0].url_private;
    });
}

function getFileContents(url) {
    return userRequester.get(url)
        .then(response => {
            return response.data
        })
}

function render(code) {
    const id = getID();
    const path = '/tmp/' + id;

    fs.mkdirSync('/tmp/' + id);
    fs.writeFileSync(
        path + '/script.js',
        code
    );
    return exec('./render.sh ' + id)
        .then(() => '/tmp/renders/' + id + '.gif')
}

function processRequest(ctx) {
    if (ctx.data.hasOwnProperty("challenge")) return ctx.data.challenge;
    if (!ctx.data.hasOwnProperty("event")) return status(400);
    if (!ctx.data.event.hasOwnProperty("thread_ts")) return status(400);
    react(ctx.data.event.ts, ctx.data.event.channel, "thumbsup");
    const thread_ts = ctx.data.event.thread_ts;
    const channel = ctx.data.event.channel;
    getThreadParent(thread_ts, channel)
        .then(getFileContents)
        .then(render)
        .then(outputFileId => sendImage(thread_ts, channel, outputFileId))
    return status(200);
}


// Launch server with options and a couple of routes
console.log(process.env.PORT || 8080);
server({ port: process.env.PORT || 8080, security: { csrf: false } }, [
    get('/gif', gif),
    post('/render', processRequest),
    error(ctx => {
        console.log("error: " + ctx.error.message);
        console.log(ctx.data);
        return status(500).send(ctx.error.message);
    })
]);
