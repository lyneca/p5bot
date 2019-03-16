const server = require('server');
const axios = require('axios')

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
    console.log("Reacting")
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

function sendImage(ctx, id) {
    console.log("sending " + id)
    // axios.post();
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
    console.log(code)

    const id = getID();
    const path = '/tmp/' + id;

    fs.mkdirSync('/tmp/' + id);
    fs.writeFileSync(
        path + '/script.js',
        code
    );
    return exec('./render.sh ' + id)
        .then(() => id)
}

function processRequest(ctx) {
    console.log(ctx.data)
    if (ctx.data.hasOwnProperty("challenge")) return ctx.data.challenge;
    if (!ctx.data.hasOwnProperty("event")) return status(400);
    if (!ctx.data.event.hasOwnProperty("thread_ts")) return status(400);
    react(ctx.data.event.ts, ctx.data.event.channel, "thumbsup");
    getThreadParent(ctx.data.event.thread_ts, ctx.data.event.channel)
        .then(getFileContents)
        .then(render)
        .then(outputFileId => sendImage(ctx, outputFileId))
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
