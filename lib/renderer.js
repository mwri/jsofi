class renderer {
    render (raw) {
        return this.render_recurse(raw);
    }

    render_recurse (raw) {
        switch (raw.type) {
        case 'op':
            return this.render_op(raw);
        case 'string':
            return this.render_string(raw);
        case 'number':
            return this.render_number(raw);
        case 'regex':
            return this.render_regex(raw);
        case 'var':
            return this.render_var(raw);
        case 'fun':
            return this.render_fun(raw);
        default:
            console.log(raw);
            throw new Error(`${raw.type} not supported, sorry`);
        }
    }

    render_op (raw) {
        switch (raw.op) {
        case 'and':
            return `(${this.render_recurse(raw.operands[0])} & ${this.render_recurse(raw.operands[1])})`;
        case 'or':
            return `(${this.render_recurse(raw.operands[0])} | ${this.render_recurse(raw.operands[1])})`;
        case 'equal':
            return `(${this.render_recurse(raw.operands[0])} == ${this.render_recurse(raw.operands[1])})`;
        case 'not_equal':
            return `(${this.render_recurse(raw.operands[0])} != ${this.render_recurse(raw.operands[1])})`;
        case 'gt':
            return `(${this.render_recurse(raw.operands[0])} > ${this.render_recurse(raw.operands[1])})`;
        case 'ge':
            return `(${this.render_recurse(raw.operands[0])} >= ${this.render_recurse(raw.operands[1])})`;
        case 'lt':
            return `(${this.render_recurse(raw.operands[0])} < ${this.render_recurse(raw.operands[1])})`;
        case 'le':
            return `(${this.render_recurse(raw.operands[0])} <= ${this.render_recurse(raw.operands[1])})`;
        case 'regex_match':
            return `(${this.render_recurse(raw.operands[0])} ~= ${this.render_recurse(raw.operands[1])})`;
        case 'not':
            return `(not (${this.render_recurse(raw.operands[0])}))`;
        default:
            throw new Error(`${raw.op} operator not supported, sorry`);
        }
    }

    render_string (raw) {
        return `"${raw.val}"`;
    }

    render_number (raw) {
        return `${raw.val}`;
    }

    render_var (raw) {
        return raw.name;
    }

    render_regex (raw) {
        return `/${raw.val}/`;
    }

    render_fun (raw) {
        return `${raw.name}(${raw.args.map(this.render_recurse.bind(this)).join(", ")})`;
    }
}


module.exports = {
    'renderer': renderer,
};
