const js_beautify = require('js-beautify');

const renderer = require('./renderer.js').renderer;


class filter_fun_renderer extends renderer {
    constructor (opts) {
        super();

        if (opts === undefined)
            opts = {};
        if (opts.source === undefined)
            opts.source = false;
        if (opts.funs === undefined)
            opts.funs = {};

        this._builtin_funs = {
            'any': function any (list, filter) {
                return Object.prototype.toString.call(list) === '[object Array]' && list.filter(filter).length > 0;
            },
            'filter': function filter (list, filter) {
                return Object.prototype.toString.call(list) === '[object Array]' && list.filter(filter);
            },
            'length': function length (list) {
                return Object.prototype.toString.call(list) === '[object Array]' ? list.length : false;
            },
        };

        this._funs       = Object.assign({}, this._builtin_funs, opts.funs);
        this._render_src = opts.source;
        this._fun_name   = opts.fun_name;
    }

    render (raw, stash) {
        this._stash = stash || [];
        let js = `return ${this.render_recurse(raw)};`;

        if (this._render_src) {
            let fun_name = this._fun_name || '';
            return js_beautify.js(`function ${fun_name} (subject) { ${this._stash.filter((e) => typeof e === 'function' && this._builtin_funs[e.name] === e).map((e) => e.toString()).join('') } ${js} }`);
        } else {
            let stash = this._stash;
            let fun = new Function('stash', 'subject', js).bind(undefined, stash);
            if (this._fun_name !== undefined)
                Object.defineProperty(fun, 'name', {value: this._fun_name, writable: false});
            return fun;
        }
    }

    render_op (raw) {
        switch (raw.op) {
        case 'and':
            return `Boolean(${this.render_recurse(raw.operands[0])} && ${this.render_recurse(raw.operands[1])})`;
        case 'or':
            return `Boolean(${this.render_recurse(raw.operands[0])} || ${this.render_recurse(raw.operands[1])})`;
        case 'regex_match':
            return `Boolean(${this.render_recurse(raw.operands[1])}.exec(${this.render_recurse(raw.operands[0])}))`;
        case 'not':
            return `(!(${this.render_recurse(raw.operands[0])}))`;
        default:
            return `Boolean(${super.render_op(raw)})`;
        }
    }

    render_string (raw) {
        return `"${raw.val}"`;
    }

    render_number (raw) {
        return `${raw.val}`;
    }

    render_var (raw) {
        return `subject${raw.name.split('.').map((n) => `['${n}']`).join('')}`;
    }

    render_regex (raw) {
        let stash_len = this._stash.length;
        this._stash.push(new RegExp(raw.val));
        return this._render_src
            ? `/${raw.val}/`
            : `stash[${stash_len}]`;
    }

    render_fun (raw) {
        let stash = this._stash;

        let args = raw.args.map((a) => {
            if (a.type === 'var' || a.type === 'number' || a.type === 'string' || a.type === 'fun')
                return this.render_recurse.bind(this)(a);

            stash.push(this.render.bind(this)(a, stash));
            let stash_index = stash.length - 1;
            return this._render_src
                ? `(${this.render.bind(this)(a, stash)})`
                : `stash[${stash_index}]`;
        });

        let stash_index = 0;
        while (stash_index < stash.length && stash[stash_index] !== this._funs[raw.name])
            stash_index++;
        if (stash_index === stash.length)
            stash.push(this._funs[raw.name]);

        return this._render_src
            ? `${raw.name}(${args.join(", ")})`
            : `stash[${stash_index}](${args.join(", ")})`;
    }
}


module.exports = {
    'renderer': filter_fun_renderer,
};
