const server = require('server');

const { get, post, error } = server.router;
const { status } = server.reply;

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')

function sendImage(ctx, id) {
    console.log("sending " + id)
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
server({ port: process.env.PORT || 8080, security: { csrf: false } }, [
    get('/gif', gif),
    post('/render', render),
    error(ctx => status(500).send(ctx.error.message))
]);
