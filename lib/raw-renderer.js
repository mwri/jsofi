const renderer = require('./renderer.js').renderer;


class raw_renderer extends renderer {
    constructor (opts) {
        super();
    }

    render (raw) {
        return raw;
    }
}


module.exports = {
    'renderer': raw_renderer,
};
