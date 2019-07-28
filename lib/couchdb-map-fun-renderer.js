const js_beautify = require('js-beautify');

const filter_fun_renderer = require('./filter-fun-renderer.js').renderer;


class couchdb_map_fun_renderer extends filter_fun_renderer {
    constructor (opts) {
        if (opts === undefined)
            opts = {};
        if (opts.emit_src === undefined)
            opts.emit_src = 'emit(doc._id, doc);';
        opts.source = true;
        opts.fun_name = 'filter_fun';

        super(opts);

        this._emit_src = opts.emit_src;
    }

    render (raw, stash) {
        let filter_fun_src = super.render(raw, stash);

        return stash === undefined
            ? js_beautify.js(`function (doc) { ${filter_fun_src} if (filter_fun(doc)) { ${this._emit_src} } }`)
            : filter_fun_src;
    }
}


module.exports = {
    'renderer': couchdb_map_fun_renderer,
};
