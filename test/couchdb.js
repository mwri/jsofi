const assert = require('assert');
const nano   = require('nano');

const jsofi                    = require('./../lib/index.js');
const filter_fun_renderer      = require('./../lib/filter-fun-renderer.js');
const couchdb_map_fun_renderer = require('./../lib/couchdb-map-fun-renderer.js');
const expr_renderer            = require('./../lib/expr-renderer.js');

const data = require('./data.js');


let default_set       = data.set.default;
let simple_test_specs = data.test_specs.simple;
let fun_test_specs    = data.test_specs.fun;
let join_test_specs   = data.test_specs.join;

let test_specs = {
    'simple': simple_test_specs,
    'fun':    fun_test_specs,
    'join':   join_test_specs,
};


describe('integration', function () {
    describe('couchdb (disabled for coverage)', function () {
        beforeEach(async function () {
            if (process.env.JSOFI_TEST_COUCHDB_HOST === undefined)
                this.skip();

            this._db = nano(`http://${process.env.JSOFI_TEST_COUCHDB_USER}:${process.env.JSOFI_TEST_COUCHDB_PASSWORD}@${process.env.JSOFI_TEST_COUCHDB_HOST}`);

            try {
                await this._db.db.destroy('jsofi-tests');
            } catch (err) {
                if (!/does not exist/.exec(err))
                    throw err;
            }
            await this._db.db.create('jsofi-tests');
            this._table = await this._db.use('jsofi-tests');
            await Promise.all(default_set.map((e) => this._table.insert(e)));
        });

        beforeEach(async function () {
            this._compiler = new jsofi.compiler();
            this._renderer = new couchdb_map_fun_renderer.renderer();
        });

        afterEach(async function () {
            try {
                await this._db.db.destroy('jsofi-tests');
            } catch (err) {
                if (!/does not exist/.exec(err))
                    throw err;
            }
        });

        for (test_spec_name in test_specs) {
            describe(test_spec_name+' cases', function () {
                for (let test_spec of test_specs[test_spec_name]) {
                    it(test_spec.descr, async function () {
                        let parser  = this._compiler.parser(test_spec.expr);
                        let fun_src = parser.render(this._renderer);

                        let design_doc = {
                            '_id': '_design/foo',
                            'views' : {
                                'bar': {
                                    'map': fun_src,
                                }
                            }
                        };
                        await this._table.insert(design_doc);

                        let r = await this._table.view('foo', 'bar');
                        assert.deepEqual(sorted_ids(r.rows.map((e) => e.value)), sorted_ids(test_spec.result));
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
