let assert = require('assert');

const jsofi                    = require('./../lib/index.js');
const filter_fun_renderer      = require('./../lib/filter-fun-renderer.js');
const couchdb_map_fun_renderer = require('./../lib/couchdb-map-fun-renderer.js');
const expr_renderer            = require('./../lib/expr-renderer.js');

const data = require('./data.js');


let debug = false;

let default_set       = data.set.default;
let simple_test_specs = data.test_specs.simple;
let fun_test_specs    = data.test_specs.fun;
let join_test_specs   = data.test_specs.join;

let test_specs = {
    'simple': simple_test_specs,
    'fun':    fun_test_specs,
    'join':   join_test_specs,
};


describe('filter_fun renderer', function () {
    beforeEach(async function () {
        this._compiler = new jsofi.compiler();
        this._renderer = new filter_fun_renderer.renderer();
    });

    describe('correct result set', function () {
        for (test_spec_name in test_specs) {
            describe(test_spec_name+' cases', function () {
                for (let test_spec of test_specs[test_spec_name]) {
                    it(test_spec.descr, function () {
                        let parser = this._compiler.parser(test_spec.expr);
                        let filter = parser.render(this._renderer);

                        if (debug) {
                            console.log(`Expression: ${test_spec.expr}`);
                            console.log(`Expected:   [${sorted_ids(test_spec.result).join(", ")}]`);
                        }
                        assert_filter_result(filter, test_spec.result);
                    });
                }
            });
        }
    });
});


describe('expr renderer', function () {
    beforeEach(async function () {
        this._compiler      = new jsofi.compiler();
        this._ff_renderer   = new filter_fun_renderer.renderer();
        this._expr_renderer = new expr_renderer.renderer();
    });

    describe('recompiles to filter for correct result set', function () {
        for (test_spec_name in test_specs) {
            describe(test_spec_name+' cases', function () {
                for (let test_spec of test_specs[test_spec_name]) {
                    it(test_spec.descr, function () {
                        let parser1 = this._compiler.parser(test_spec.expr);
                        let expr2   = parser1.render(this._expr_renderer);

                        let parser2 = this._compiler.parser(expr2);
                        let filter  = parser2.render(this._ff_renderer);

                        assert_filter_result(filter, test_spec.result);
                    });
                }
            });
        }
    });
});


describe('filter_fun(source) renderer (disabled for coverage)', function () {
    beforeEach(async function () {
        this._compiler = new jsofi.compiler();
        this._renderer = new filter_fun_renderer.renderer({'source': true});
    });

    describe('correct result set', function () {
        for (test_spec_name in test_specs) {
            describe(test_spec_name+' cases', function () {
                for (let test_spec of test_specs[test_spec_name]) {
                    it(test_spec.descr, function () {
                        let parser     = this._compiler.parser(test_spec.expr);
                        let filter_src = parser.render(this._renderer);
                        let filter     = new Function('subject', `return (${filter_src})(subject);`);

                        assert_filter_result(filter, test_spec.result);
                    });
                }
            });
        }
    });
});


describe('couchdb_map_fun renderer', function () {
    beforeEach(async function () {
        this._compiler = new jsofi.compiler();
        this._renderer = new couchdb_map_fun_renderer.renderer();
    });

    describe('renders', function () {
        for (test_spec_name in test_specs) {
            describe(test_spec_name+' cases', function () {
                for (let test_spec of test_specs[test_spec_name]) {
                    it(test_spec.descr, function () {
                        let parser  = this._compiler.parser(test_spec.expr);
                        let fun_src = parser.render(this._renderer);

                        assert(typeof fun_src, 'string');
                    });
                }
            });
        }
    });

    describe('compiles', function () {
        for (test_spec_name in test_specs) {
            describe(test_spec_name+' cases', function () {
                for (let test_spec of test_specs[test_spec_name]) {
                    it(test_spec.descr, function () {
                        let parser  = this._compiler.parser(test_spec.expr);
                        let fun_src = parser.render(this._renderer);

                        let fun = new Function('doc', `return (${fun_src})(doc);`);
                        assert(typeof fun, 'function');
                    });
                }
            });
        }
    });
});


function assert_filter_result (filter, expected_result) {
    let result = default_set.filter(filter);
    assert.deepEqual(sorted_ids(result), sorted_ids(expected_result));
}

function sorted_ids (set) {
    return set.map((o) => o.id).sort();
}
