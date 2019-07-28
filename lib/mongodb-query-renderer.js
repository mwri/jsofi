let renderer = require('./renderer.js').renderer;


class mongodb_query_renderer extends renderer {
    render_op (raw) {
        switch (raw.op) {
        case 'and':
            return {'$and': [this.render_recurse(raw.operands[0]), this.render_recurse(raw.operands[1])]};
        case 'or':
            return {'$or': [this.render_recurse(raw.operands[0]), this.render_recurse(raw.operands[1])]};
        case 'equal':
            return {[this.render_recurse(raw.operands[0])]: {'$eq': this.render_recurse(raw.operands[1])}};
        case 'not_equal':
            return {[this.render_recurse(raw.operands[0])]: {'$ne': this.render_recurse(raw.operands[1])}};
        case 'gt':
            return {[this.render_recurse(raw.operands[0])]: {'$gt': this.render_recurse(raw.operands[1])}};
        case 'ge':
            return {[this.render_recurse(raw.operands[0])]: {'$gte': this.render_recurse(raw.operands[1])}};
        case 'lt':
            return {[this.render_recurse(raw.operands[0])]: {'$lt': this.render_recurse(raw.operands[1])}};
        case 'le':
            return {[this.render_recurse(raw.operands[0])]: {'$lte': this.render_recurse(raw.operands[1])}};
        case 'regex_match':
            return {[this.render_recurse(raw.operands[0])]: {'$regex': this.render_recurse(raw.operands[1])}};
        default:
            throw new Error(`${raw.op} operator not supported, sorry`);
        }
    }

    render_string (raw) {
        return raw.val;
    }

    render_number (raw) {
        return Number(raw.val);
    }

    render_regex (raw) {
        return new RegExp(raw.val);
    }

    render_fun () {
        throw new Error(`functions not supported by mongodb query renderer, sorry`);
    }
}


module.exports = {
    'renderer': mongodb_query_renderer,
};
