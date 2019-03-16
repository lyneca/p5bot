const server = require('server');
const axios = require('axios')

const { get, post, error } = server.router;
const { status } = server.reply;

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')

function react(timestamp, channel, name) {
    console.log("Reacting")
    axios.post(
        'https://slack.com/api/reactions.add',
        {
            token: process.env.TOKEN,
            name: name,
            channel: channel,
            timestamp: timestamp
        }
    )
        .then(r => console.log(r))
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

function render(ctx) {
    console.log(ctx.data)
    if (ctx.data.hasOwnProperty("challenge")) return ctx.data.challenge;
    if (!ctx.data.hasOwnProperty("event")) return status(400);
    if (!ctx.data.event.hasOwnProperty("thread_ts")) return status(400);
    react(ctx.data.event.ts, ctx.data.event.channel, "thumbsup");
    return status(200);
    const id = getID();
    const path = '/tmp/' + id;

    fs.mkdirSync('/tmp/' + id);
    fs.writeFileSync(
        path + '/script.js',
        ctx.data.code
    );
    exec('./render.sh ' + id)
        .then(() => sendImage(ctx, id))
    return "Rendering...";
}

// Launch server with options and a couple of routes
console.log(process.env.PORT || 8080);
server({ port: process.env.PORT || 8080, security: { csrf: false } }, [
    get('/gif', gif),
    post('/render', render),
    error(ctx => {
        console.log("error: " + ctx.error.message);
        console.log(ctx.data);
        return status(500).send(ctx.error.message);
    })
]);
