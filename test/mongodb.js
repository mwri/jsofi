const assert  = require('assert');
const mongodb = require('mongodb').MongoClient;

const jsofi                    = require('./../lib/index.js');
const filter_fun_renderer      = require('./../lib/filter-fun-renderer.js');
const mongodb_map_fun_renderer = require('./../lib/mongodb-query-renderer.js');
const expr_renderer            = require('./../lib/expr-renderer.js');

const data = require('./data.js');


let default_set       = data.set.default;
let simple_test_specs = data.test_specs.simple;
let join_test_specs   = data.test_specs.join;

let test_specs = {
    'simple': simple_test_specs.filter((e) => e.descr !== 'not'),
    'join':   join_test_specs,
};


describe('integration', function () {
    describe('mongodb', function () {
        beforeEach(async function () {
            if (process.env.JSOFI_TEST_MONGODB_HOST === undefined)
                this.skip();

            return new Promise((res, rej) => {
                mongodb.connect(
                    `mongodb://${process.env.JSOFI_TEST_MONGODB_USER}:${process.env.JSOFI_TEST_MONGODB_PASSWORD}@${process.env.JSOFI_TEST_MONGODB_HOST}`,
                    {'useNewUrlParser': true},
                    (err, client) => {
                        if (err)
                            throw err;

                        this._client = client;
                        this._db = client.db('jsofi_tests');
                        this._table = this._db.collection('jsofi_tests');

                        this._table.insertMany(
                            default_set,
                            (err, result) => {
                                if (err !== null) {
                                    this._client.close(() => rej(err));
                                } else {
                                    assert.equal(result.result.n, default_set.length);
                                    assert.equal(result.ops.length, default_set.length);
                                    res();
                                }
                            }
                        );
                    }
                );
            });
        });

        beforeEach(async function () {
            this._compiler = new jsofi.compiler();
            this._renderer = new mongodb_map_fun_renderer.renderer();
        });

        afterEach(async function () {
            return new Promise((res, rej) => {
                this._table.drop((err) => {
                    assert.equal(err, null);
                    this._client.close((err) => {
                        assert.equal(err, null);
                        res();
                    });
                });
            });
        });

        for (test_spec_name in test_specs) {
            describe(test_spec_name+' cases', function () {
                for (let test_spec of test_specs[test_spec_name]) {
                    it(test_spec.descr, async function () {
                        let parser = this._compiler.parser(test_spec.expr);
                        let query  = parser.render(this._renderer);

                        return new Promise((res, rej) => {
                            this._table.find(query).toArray(function(err, docs) {
                                assert.equal(err, null);
                                assert.deepEqual(sorted_ids(docs), sorted_ids(test_spec.result));
                                res();
                            });
                        });
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
