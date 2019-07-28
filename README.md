# jsofi [![Build Status](https://travis-ci.org/mwri/jsofi.svg?branch=master)](https://travis-ci.org/mwri/jsofi) [![Coverage Status](https://coveralls.io/repos/github/mwri/jsofi/badge.svg?branch=master)](https://coveralls.io/github/mwri/jsofi?branch=master)

JSOFI (JSON Filter) compiles boolean logic expressions into functions which may
be applied to lists of objects for filtering.

Allowed expressions include equality, inquality, numeric greater and less than,
regular expression matching, accessing sub object and list members, functions
and more.

## Contents

1. [Contents](#contents).
2. [Quick start](#quick-start).
3. [Operators](#operators).
4. [Functions](#functions).
   1. [Built in functions](#built-in-functions).
      1. [any](#any).
      2. [filter](#filter).
      3. [length](#length).
   2. [Custom functions](#custom-functions).
   3. [Sub queries](#sub-queries).
5. [Renderers](#renderers).
   1. [Built in renderers](#built-in-renderers).
      1. [filter-fun-renderer](#filter-fun-renderer).
      2. [raw-renderer](#raw-renderer).
      3. [expr-renderer](#expr-renderer).
      4. [couchdb-map-fun-renderer](#couchdb-map-fun-renderer).
      5. [mongodb-query-renderer](#mongodb-query-renderer).
   2. [Custom renderers](#custom-renderers).
6. [Example expressions](#example-expressions).
7. [Build](#build).


## Quick start

Here's an example, first we set some example data:

```javascript
let object_list = [
    {'id': 1, 'food': 'apple',   'rating': 7, 'cols': ['green', 'red'],             'extra': {'fruit': true, 'veg': false} },
    {'id': 2, 'food': 'pepper',  'rating': 5, 'cols': ['green', 'yellow', 'red'],   'extra': {'fruit': false, 'veg': true} },
    {'id': 3, 'food': 'bananna', 'rating': 3, 'cols': ['green', 'yellow', 'black'], 'extra': {'fruit': true, 'veg': false} },
    {'id': 4, 'food': 'rice',    'rating': 3, 'cols': ['white', 'brown'],           'extra': {'fruit': false, 'veg': false}},
    {'id': 5, 'food': 'egg',     'rating': 8, 'cols': ['white', 'brown', 'beige'],  'extra': {'fruit': false, 'veg': false}},
    {'id': 6, 'food': 'tomatoe', 'rating': 5, 'cols': ['red', 'yellow', 'green'],   'extra': {'fruit': false, 'veg': true} },
];
```

Now create a compiler and compile an expression into a function `filter_fun`
which can be used to filter the example data we created:

```javascript
let jsofi = require('jsofi');

let compiler      = new jsofi.compiler();
let filter_fun    = compiler.filter_fun('rating >= 5');
let filtered_list = object_list.filter(filter_fun);
```

It is possible to use different renderers, so that an expression can be
rendered in another language or for a slightly different environment for
example. To do this a slightly longer form of the above code is adopted:

```javascript
let compiler      = new jsofi.compiler();
let parser        = compiler.parser('rating >= 5');
let filter_fun    = parser.render(new jsofi.renderer.filter_fun());
let filtered_list = object_list.filter(filter_fun);
```

In this case we are still using the same `filter-fun-renderer`, which is
the default, but other renderers can be applied instead, for example there
is a raw renderer which returns the raw parse tree of the expression without
any further processing, one which renders back the original expression (it
may have different parentheses distribution but will be functionally the same)
and you can also use the `filter-fun-renderer` to render javascript source
code for the filter function, useful for embedding a filter without the
expression and compilation overhead. See [renderers](#renderers) later for
more information about these. Writing your own renderer is very simple
too (see [custom renderers](#custom-renderers)).

## Operators

Supported operators are as follows

| Operator | Description           |
|----------|-----------------------|
| ==       | Equal                 |
| !=       | Not equal             |
| <        | Less than             |
| <=       | Less than or equal    |
| >        | Greater than          |
| >=       | Greater than or equal |
| ~=       | Regex match           |
| &        | Logical AND           |
| and      | Logical AND           |
| &#124;   | Logical OR            |
| or       | Logical OR            |
| not      | Logical NOT           |

Also a period may be used to access sub object data (e.g. `extra.veg`
in the example data above) and parentheses can be used to vary the
operator precedence.

## Functions

The `fun-filter-renderer` includes built in functions, and allows for
the addition of custom functions as well. Calling a function is done
very much like most languages, so `length(cols) > 1` for example would
match obejcts where `cols` is an array with two or more member.

### Built in functions

Three built in functions exist.

#### any

Operates on a list and returns true if any of the list member match
a condition, for example take the following data set:

```javascript
let object_list = [
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
```

You can find all the objects where `attribs` has a member with a `name`
of `wer` by the query `any(attribs, name == "wer")`. This should find
IDs 1 and 4.

To achieve this, the `name == "wer"` becomes a sub query run for each
member of `attribs` (see [sub queries](#sub-queries) below).

#### filter

Filter also operates on a list, and filters it according to the sub
query given, returning the result. It does not therefore return a
boolean result so a query such as `filter(attribs, name == "wer")`
is not valid (though it may compile and run, with undefined results).

#### length

Length also operates on a list and returns its length. As with `filter`
since this is not a booleam result a query such as  `length(attribs)`
is not valid, but `length(attribs) > 0` is valid (finding all objects
where `attribs` is a non empty list) and it could be combined with
`filter` in a query like `length(filter(attribs, name == "wer") > 1`
to find objects where there is more than one member of the list with
a `name` of `"wer"` (ID 4 in this case).

### Custom functions

To add custom functions pass a `funs` option to the `filter-fun-renderer`
renderer constructor, for example here's how a `includes_yellow` function
is added which matches objects where one of the array members is the
string `"yellow"`:

```javascript
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
```

### Sub queries

Functions can also be used to achieve sub query effects. To explain this
the [any function](#any) query illustrated above is revisited.

When a function is used in an expression and one of the function arguments
is a boolean expression itself as with `any(attribs, name == "wer")`, the
`any` function is called with two arguments, as would seam reasonable the
first argument is the value of `attribs` (which is a list in this instance)
but the second argument is puzzling, as it's not a value as such in the
context of the objects in the list! So, this expression is compiled as a
function, like the filter function returned by the `filter-fun-renderer`
renderer, and it is then used at the discretion of the `any` function
implementation.

It's not necessary to know this to use the `any` function of course, but
it is necessary to know it in order to write custom functions which take
advantage of this feature.

The `any` function is implemented as follows:

```javascript
function any (list, filter) {
    return list.filter(filter).length > 0;
}
```

This shows clearly then how the `any` function uses this sub query function
to do its work.

## Renderers

### Built in renderers

#### filter-fun-renderer

The default filter function renderer renders a function which may
be used for filtering lists of objects:

Functions may be added to the built in functions but using the `funs`
option (see [functions](#functions) above.

Javascript source may be rendered instead by passing `source: true`
like this:

```javascript
let renderer = new filter_fun_renderer({
    'source': true,
});
```

The function returned, source or not, will be anonymous. To give it
a name use the `fun_name` option, like this:

```javascript
let renderer = new filter_fun_renderer({
    'fun_name': 'my_filter',
});
```

Note that any built in functions used will have their source included
but custom functions will not as their correct rendering cannot be
guaranteed.

Once the renderer is created as above, it can be used as usual:

```javascript
let js_source = parser.render(renderer);
```

#### raw-renderer

This simply passes through the raw tree structure from the Jison
parse of the expression. Useful only for debugging and development
purposes.

#### expr-renderer

Rerenders the original expression, though parentheses may vary from
the original. This is useful to get a canonical version of the
expression.

#### couchdb-map-fun-renderer

[CouchDB](http://couchdb.apache.org/) has materialised views (actually
more like query caches which are brought up to date when used) filtered
by Javascript functions operating on the data. Such functions are given
to CouchDB in source form and this renderer renders such source.

This means an expression can be invoked efficiently at run time, though
the provision of more and more views will require more disk and memory
utilisation and degrade write speeds.

One option `emit_src` is supported to dictate what is emitted. The default
is `emit(doc._id, doc);`, and this source is inserted into the map function
to be run when the expression evaluates `true` for the data given.

```javascript
let compiler    = new jsofi.compiler();
let parser      = compiler.parser('rating >= 5');

let renderer = new jsofi.renderer.couchdb_map_fun({
    'emit_src': 'emit(doc._id, doc);',
});

let map_fun_src = parser.render(new jsofi.renderer.couchdb_map_fun());
```

#### mongodb-query-renderer

MongoDB does not have materialised views, so the benefit profile
vs CouchDB or CouchBASE is quite different. The option of having
MongoDB do the heavy lifting rather than pulling a large data set
to your nodejs app and filtering it there may still be highly
beneficial though, even if an index is not leveraged.

Note that support for MongoDB is incomplete, MongoDB's `$not`
operator and the functions are difficult to support.

```javascript
let compiler    = new jsofi.compiler();
let parser      = compiler.parser('rating >= 5');

let renderer = new jsofi.renderer.mongodb_query();

let query = parser.render(new jsofi.renderer.couchdb_map_fun());
console.log("QUERY", query);

const mongodb = require('mongodb');
mongodb.MongoClient.connect(
    mongodb_host,
    (err, client) => {
        let collection = this._db.collection('my_collection');
        collection.find(query).toArray(function(err, docs) {
            console.log("RESULT", docs);
        });
    }
);
```

### custom-renderers

The best way to understand how to write a custom renderer is study
the existing built in renderers, and then write your own class. Your
new class should extend the jsofi `renderer` class and implement `render`,
`render_op`, `render_string`, `render_number`, `render_var` and other
methods (all optional) to convert the raw structures returned by the
Jison parser into the form you require.

The minimum renderer (with entirely default rendering) will look like
this therefore:

```javascript
let renderer = require('./renderer.js').renderer;

class expr_renderer extends renderer {
}

module.exports = {
    'renderer': expr_renderer,
};
```

Override the constructor to add options to your renderer if required.

Override `render` to change the whole rendering process (it doesn't
after all have to be based on the recursive pattern used by the built
in renderers).

If you keep `render`, then overriding `render_op`, `render_string`,
`render_number`, etc, where ever the default rendition is not
usable, is probably all you have to do.

## Example expressions

Working from the quick start example data again:

```javascript
let object_list = [
    {'id': 1, 'food': 'apple',   'rating': 7, 'cols': ['green', 'red'],             'extra': {'fruit': true, 'veg': false} },
    {'id': 2, 'food': 'pepper',  'rating': 5, 'cols': ['green', 'yellow', 'red'],   'extra': {'fruit': false, 'veg': true} },
    {'id': 3, 'food': 'bananna', 'rating': 3, 'cols': ['green', 'yellow', 'black'], 'extra': {'fruit': true, 'veg': false} },
    {'id': 4, 'food': 'rice',    'rating': 3, 'cols': ['white', 'brown'],           'extra': {'fruit': false, 'veg': false}},
    {'id': 5, 'food': 'egg',     'rating': 8, 'cols': ['white', 'brown', 'beige'],  'extra': {'fruit': false, 'veg': false}},
    {'id': 6, 'food': 'tomatoe', 'rating': 5, 'cols': ['red', 'yellow', 'green'],   'extra': {'fruit': false, 'veg': true} },
];
```

The following are example queries:

| Description               | Query                                           |
|---------------------------|-------------------------------------------------|
| IDs 1 and 4               | (id == 1) &#124; (id == 4)                      |
| All fruit                 | extra.fruit                                     |
| All vegetables            | extra.veg                                       |
| Fruit and veg with an "e" | (extra.veg &#124; extra.fruit) & food ~= /e/    |
| All the non fruit and veg | not extra.fruit & not extra.veg                 |

## Build

run `npm install` to install the dependencies, `npm run test` (or
`npm run coverage`) to run the test suite.

CouchDB and MongoDB integration tests will be skipped by default.
If you want to run these you must set environment variables to
specify the addresses or the services, and usernames and passwords.

| Environment variable        | Description                                            |
|-----------------------------|--------------------------------------------------------|
| JSOFI_TEST_COUCHDB_HOST     | Address of the CouchDB server (e.g. "localhost:5984")  |
| JSOFI_TEST_COUCHDB_USER     | User to use authenticating to the CouchDB server       |
| JSOFI_TEST_COUCHDB_PASSWORD | Password to use authenticating to the CouchDB server   |
| JSOFI_TEST_MONGODB_HOST     | Address of the CouchDB server (e.g. "localhost:27017") |
| JSOFI_TEST_MONGODB_USER     | User to use authenticating to the MongoDB server       |
| JSOFI_TEST_MONGODB_PASSWORD | Password to use authenticating to the MongoDB server   |
