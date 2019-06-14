let assert = require('assert');

const jsofi                    = require('./../lib/index.js');
const filter_fun_renderer      = require("./../lib/filter-fun-renderer.js");
const couchdb_map_fun_renderer = require("./../lib/couchdb-map-fun-renderer.js");
const expr_renderer            = require("./../lib/expr-renderer.js");


let debug = false;

let default_set = [
    {'id': 1,
     'os': 'ios', 'mem': 1024, 'cores': 2,
     'complex': {'a': 1, 'b': {'c': 5}}, 'foods': ['eggs', 'milk'],
     'named': [{'name': 'one', 'x': 3}],
    },
    {'id': 2,
     'os': 'indi', 'mem': 2048, 'cores': 4,
     'complex': {'a': 4, 'b': {'c': 9}}, 'foods': ['eggs', 'bacon'],
     'named': [{'name': 'one', 'x': 1}, {'name': 'three', 'x': 1}, {'name': 'six', 'x': 8}],
    },
    {'id': 3,
     'os': 'ios', 'mem': 2048, 'cores': 4,
     'complex': {'a': 1, 'b': {'c': 5}}, 'foods': ['salad', 'bacon'],
     'named': [{'name': 'five', 'x': 8}, {'name': 'three', 'x': 1}, {'name': 'five', 'x': 8}],
     'opt': [2],
    },
    {'id': 4,
     'os': 'ios', 'mem': 4096, 'cores': 2,
     'complex': {'a': 8, 'b': {'c': 7}}, 'foods': ['eggs', 'bacon'],
     'named': [{'name': 'one', 'x': 8}, {'name': 'three', 'x': 1}, {'name': 'six', 'x': 3}],
     'opt': [],
    },
    {'id': 5,
     'os': 'linux', 'mem': 4096, 'cores': 4,
     'complex': {'a': 1, 'b': {'c': 5}}, 'foods': ['eggs', 'bacon'],
     'named': [{'name': 'two', 'x': 3}, {'name': 'three', 'x': 8}],
    },
    {'id': 6,
     'os': 'windows', 'mem': 4096, 'cores': 16,
     'complex': {'a': 4, 'b': {'c': 5}}, 'foods': ['eggs', 'bacon'],
     'named': [{'name': 'eight', 'x': 4}, {'name': 'three', 'x': 4}],
    },
    {'id': 7,
     'os': 'windows', 'mem': 8192, 'cores': 8,
     'complex': {'a': 2, 'b': {'c': 7}}, 'foods': ['milk', 'bacon'],
     'named': [{'name': 'seven', 'x': 3}, {'name': 'three', 'x': 5}],
    },
    {'id': 8,
     'os': 'lark', 'mem': 8192, 'cores': 8,
     'complex': {'a': 9, 'b': {'c': 1}}, 'foods': ['bacon', 'eggs'],
     'named': [{'name': 'one', 'x': 8}, {'name': 'six', 'x': 4}, {'name': 'three', 'x': 3}],
    },
    {'id': 9,
     'os': 'linux', 'mem': 8192, 'cores': 16,
     'complex': {'a': 4, 'b': {'c': 2}}, 'foods': ['eggs', 'salad'],
     'named': [{'name': 'five', 'x': 3}, {'name': 'one', 'x': 4}],
    },
    {'id': 10,
     'os': '', 'mem': 128, 'cores': 1,
     'complex': {'a': 5, 'b': {'c': 5}}, 'foods': ['milk', 'coffee'],
     'named': [{'name': 'one', 'x': 4}, {'name': 'seven', 'x': 3}],
    },
];


let simple_test_specs = [
    {
        'descr': 'single integer equality match', 'expr': 'id == 1',
        'result': calc_eq((o) => o.id, 1),
    },
    {
        'descr': 'multiple integer equality match', 'expr': 'cores == 4',
        'result': calc_eq((o) => o.cores, 4),
    },

    {
        'descr': 'single string equality match', 'expr': 'os == "lark"',
        'result': calc_eq((o) => o.os, 'lark'),
    },
    {
        'descr': 'multiple string equality match', 'expr': 'os == "ios"',
        'result': calc_eq((o) => o.os, 'ios'),
    },

    {
        'descr': 'single integer inequality match', 'expr': 'id != 1',
        'result': calc_ne((o) => o.id, 1),
    },
    {
        'descr': 'multiple string inequality match', 'expr': 'os != "ios"',
        'result': calc_ne((o) => o.os, "ios"),
    },

    {
        'descr': 'greater than match', 'expr': 'cores > 8',
        'result': calc_gt((o) => o.cores, 8),
    },
    {
        'descr': 'greater than or equal match', 'expr': 'cores >= 8',
        'result': calc_ge((o) => o.cores, 8),
    },
    {
        'descr': 'less than match', 'expr': 'cores < 8',
        'result': calc_lt((o) => o.cores, 8),
    },
    {
        'descr': 'less than or equal match', 'expr': 'cores <= 8',
        'result': calc_le((o) => o.cores, 8),
    },

    {
        'descr': 'regex match', 'expr': 'os ~= /^l/',
        'result': calc_eq((o) => /^l/.exec(o.os) && true || false, true),
    },

    {
        'descr': 'sub property equality match', 'expr': 'complex.a == 4',
        'result': calc_eq((o) => o.complex.a, 4),
    },

    {
        'descr': 'not', 'expr': 'not (os ~= /^l/)',
        'result': calc_eq((o) => /^l/.exec(o.os) && true || false, false),
    },
];

let fun_test_specs = [
    {
        'descr': 'any()', 'expr': 'any(named, name == "one")',
        'result': calc_eq((o) => o.named.filter((o) => o.name == "one").length > 0, true),
    },
    {
        'descr': 'length()', 'expr': 'length(named) > 2',
        'result': calc_gt((o) => o.named.length, 2),
    },
    {
        'descr': 'length(filtered())', 'expr': 'length(filter(named, name == "five")) > 1',
        'result': calc_gt((o) => o.named.filter((o) => o.name === "five").length, 1),
    },
];

let join_test_specs = [
    {
        'descr': 'and operator (non overlapping sets)', 'expr': 'os == "linux" & os == "windows"',
        'result': calc_and(calc_eq((o) => o.os, 'ios'), calc_eq((o) => o.os, 'windows')),
    },
    {
        'descr': 'and operator (overlapping sets)', 'expr': 'os == "linux" & mem == 4096',
        'result': calc_and(calc_eq((o) => o.os, 'linux'), calc_eq((o) => o.mem, 4096)),
    },
    {
        'descr': 'and operator (conjoined)', 'expr': 'os == "linux" & mem == 4096 & cores == 4',
        'result': calc_and(calc_and(calc_eq((o) => o.os, 'linux'), calc_eq((o) => o.mem, 4096)), calc_eq((o) => o.cores, 4)),
    },
    {
        'descr': 'or operator (non overlapping sets)', 'expr': 'os == "linux" | os == "windows"',
        'result': calc_or(calc_eq((o) => o.os, 'linux'), calc_eq((o) => o.os, 'windows')),
    },
    {
        'descr': 'or operator (overlapping sets)', 'expr': 'os == "linux" | mem == 4096',
        'result': calc_or(calc_eq((o) => o.os, 'linux'), calc_eq((o) => o.mem, 4096)),
    },
    {
        'descr': 'or operator (conjoined)', 'expr': 'os == "linux" | mem == 4096 | cores == 4',
        'result': calc_or(calc_or(calc_eq((o) => o.os, 'linux'), calc_eq((o) => o.mem, 4096)), calc_eq((o) => o.cores, 4)),
    },
];

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

function calc_eq (fun, val, set = default_set) {
    return set.filter((o) => fun(o) == val);
}

function calc_ne (fun, val, set = default_set) {
    return set.filter((o) => fun(o) != val);
}

function calc_gt (fun, val, set = default_set) {
    return set.filter((o) => fun(o) > val);
}

function calc_ge (fun, val, set = default_set) {
    return set.filter((o) => fun(o) >= val);
}

function calc_lt (fun, val, set = default_set) {
    return set.filter((o) => fun(o) < val);
}

function calc_le (fun, val, set = default_set) {
    return set.filter((o) => fun(o) <= val);
}

function calc_and (set1, set2) {
    return set1.filter((o1) => set2.filter((o2) => o2.id == o1.id).length > 0);
}

function calc_or (set1, set2) {
    return set1.concat(set2).sort().filter((o, i, s) => s.indexOf(o) === i);
}

function sorted_ids (set) {
    return set.map((o) => o.id).sort();
}
