const jison = require("jison").Jison;

const jison_grammars           = require("./jison-grammars.js");
const filter_fun_renderer      = require("./filter-fun-renderer.js").renderer;
const expr_renderer            = require("./expr-renderer.js").renderer;
const raw_renderer             = require("./raw-renderer.js").renderer;
const couchdb_map_fun_renderer = require("./couchdb-map-fun-renderer.js").renderer;


class compiler {
    constructor (opts) {
        this._jison_grammar = jison_grammars['standard'];
    }

    prepare () {
        this._jison_parser = new jison.Parser(this._jison_grammar);
    }

    parser (expr) {
        if (this._jison_parser === undefined)
            this.prepare();

        return new parser(this._jison_parser.parse(expr));
    }

    filter_fun (expr) {
        return this.parser(expr).render();
    }
}


class parser {
    constructor (parse) {
        this._parse = parse;
    }

    render (renderer) {
        if (renderer === undefined)
            renderer = new filter_fun_renderer();

        return renderer.render(this._parse);
    }
}


module.exports = {
    'compiler': compiler,
    'renderer': {
        'filter_fun':      filter_fun_renderer,
        'expr':            expr_renderer,
        'raw':             raw_renderer,
        'couchdb_map_fun': couchdb_map_fun_renderer,
    },
};
