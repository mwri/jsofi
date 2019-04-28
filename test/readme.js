let assert = require('assert');

const jsofi               = require('./../lib/index.js');
const filter_fun_renderer = require("./../lib/filter-fun-renderer.js").renderer;
const expr_renderer       = require("./../lib/expr-renderer.js").renderer;


let object_list = [
    {'id': 1, 'food': 'apple',   'rating': 7, 'cols': ['green', 'red'],             'extra': {'fruit': true, 'veg': false} },
    {'id': 2, 'food': 'pepper',  'rating': 5, 'cols': ['green', 'yellow', 'red'],   'extra': {'fruit': false, 'veg': true} },
    {'id': 3, 'food': 'bananna', 'rating': 3, 'cols': ['green', 'yellow', 'black'], 'extra': {'fruit': true, 'veg': false} },
    {'id': 4, 'food': 'rice',    'rating': 3, 'cols': ['white', 'brown'],           'extra': {'fruit': false, 'veg': false}},
    {'id': 5, 'food': 'egg',     'rating': 8, 'cols': ['white', 'brown', 'beige'],  'extra': {'fruit': false, 'veg': false}},
    {'id': 5, 'food': 'tomatoe', 'rating': 5, 'cols': ['red', 'yellow', 'green'],   'extra': {'fruit': false, 'veg': true} },
];

let object_list2 = [
    {'id': 1, attribs: [
        {'name': 'foo', 'val': 'foobar'},
        {'name': 'wer', 'val': 'wertel'}
    ]},
    {'id': 2, attribs: [
        {'name': 'bar', 'val': 'barbaz'},
        {'name': 'foo', 'val': 'foobar'}
    ]},
    {'id': 3, attribs: [
        {'name': 'wok', 'val': 'wokkel'},
        {'name': 'pol', 'val': 'pollop'}
    ]},
    {'id': 4, attribs: [
        {'name': 'wer', 'val': 'wertel'},
        {'name': 'wer', 'val': 'wertel'}
    ]},
];


describe('readme', function () {
    describe('quick start', function () {
        it('short form', function () {
            let compiler      = new jsofi.compiler();
            let filter_fun    = compiler.filter_fun('rating >= 5');
            let filtered_list = object_list.filter(filter_fun);

            assert.equal(filtered_list.length, 4);
        });

        it('long form', function () {
            let compiler      = new jsofi.compiler();
            let parser        = compiler.parser('rating >= 5');
            let filter_fun    = parser.render(new filter_fun_renderer());
            let filtered_list = object_list.filter(filter_fun);

            assert.equal(filtered_list.length, 4);
        });
    });

    it('functions', function () {
        describe('custom', function () {
            let renderer = new filter_fun_renderer({
                'funs': {
                    'includes_yellow': function includes_yellow (list) {
                        return list.filter((col) => col == "yellow").length > 0;
                    },
                },
            });

            let compiler      = new jsofi.compiler();
            let parser        = compiler.parser('includes_yellow(cols)');
            let filter_fun    = parser.render(renderer);
            let filtered_list = object_list.filter(filter_fun);

            assert.equal(filtered_list.length, 3);
        });

        describe('any', function () {
            let compiler      = new jsofi.compiler();
            let filter_fun    = compiler.filter_fun('any(attribs, name == "wer")');
            let filtered_list = object_list2.filter(filter_fun);

            assert.deepEqual(filtered_list.map((o) => o.id).sort(), [1, 4]);
        });

        describe('length_filter', function () {
            let compiler      = new jsofi.compiler();
            let filter_fun    = compiler.filter_fun('length(filter(attribs, name == "wer")) > 1');
            let filtered_list = object_list2.filter(filter_fun);

            assert.deepEqual(filtered_list.map((o) => o.id).sort(), [4]);
        });
    });

    it('renderers', function () {
        let renderer = new filter_fun_renderer({
            'source': true,
        });

        let compiler  = new jsofi.compiler();
        let parser    = compiler.parser('includes_yellow(cols)');
        let js_source = parser.render(renderer);

        assert.equal(typeof js_source, 'string');
    });
});
