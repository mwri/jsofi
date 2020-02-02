function standard () {
    let jison_lex_rules = [
        ['\\s+',                  `return undefined;`                                    ],
        ['==',                    `return '==';`                                         ],
        ['!=',                    `return '!=';`                                         ],
        ['>=',                    `return '>=';`                                         ],
        ['>',                     `return '>';`                                          ],
        ['<=',                    `return '<=';`                                         ],
        ['<',                     `return '<';`                                          ],
        ['~=',                    `return '~=';`                                         ],
        ['=~',                    `return '~=';`                                         ],
        ['&',                     `return '&';`                                          ],
        ['\\|',                   `return '|';`                                          ],
        ['and',                   `return '&';`                                          ],
        ['or',                    `return '|';`                                          ],
        ['not',                   `return 'not';`                                        ],
        ['[a-zA-Z][a-zA-Z0-9_]*', `return 'word';`                                       ],
        ['"[^"]*"',               `yytext = yytext.substr(1, yyleng-2); return 'string';`],
        ['[0-9]+(?:\.[0-9]+|)',   `return 'number';`                                     ],
        ['\\(',                   `return '(';`                                          ],
        ['\\)',                   `return ')';`                                          ],
        ['\\.',                   `return '.';`                                          ],
        [',',                     `return ',';`                                          ],
        ['\\/[^\\/]+\\/',         `yytext = yytext.substr(1, yyleng-2); return 'regex';` ],
    ];

    let jison_operators = [
        ['left', '&', 'and'          ],
        ['left', '|', 'or'           ],
        ['left', '==', '!=', '~='    ],
        ['left', '>', '>=', '<', '<='],
        ['left', '.'                 ],
        ['left', 'not'               ],
    ];

    let jison_bnf = {
        'root': [
            ['expr', 'return $1;'],
        ],
        'expr': [
            ['( expr )',      '$$ = $2;'                                                                               ],
            ['not expr',      '$$ = {"type": "op", "op": "not", operands: [$2]};'                                      ],
            ['expr & expr',   '$$ = {"type": "op", "op": "and", operands: [$1, $3]};'                                  ],
            ['expr | expr',   '$$ = {"type": "op", "op": "or", operands: [$1, $3]};'                                   ],
            ['expr > expr',   '$$ = {"type": "op", "op": "gt", operands: [$1, $3]};'                                   ],
            ['expr >= expr',  '$$ = {"type": "op", "op": "ge", operands: [$1, $3]};'                                   ],
            ['expr < expr',   '$$ = {"type": "op", "op": "lt", operands: [$1, $3]};'                                   ],
            ['expr <= expr',  '$$ = {"type": "op", "op": "le", operands: [$1, $3]};'                                   ],
            ['expr == expr',  '$$ = {"type": "op", "op": "equal", operands: [$1, $3]};'                                ],
            ['expr != expr',  '$$ = {"type": "op", "op": "not_equal", operands: [$1, $3]};'                            ],
            ['expr ~= regex', '$$ = {"type": "op", "op": "regex_match", operands: [$1, {"type": "regex", "val": $3}]};'],
            ['var',           '$$ = $1;'                                                                               ],
            ['number',        '$$ = {"type": "number", "val": $1};'                                                    ],
            ['string',        '$$ = {"type": "string", "val": $1};'                                                    ],
            ['word ( args )', '$$ = {"type": "fun", "name": $1, "args": $3};'                                          ],
        ],
        'var': [
            ['word',       '$$ = {"type": "var", "name": $1};'],
            ['var . word', '$1.name += "."+$3'                ],
        ],
        'args': [
            ['expr',        '$$ = [$1];'           ],
            ['args , expr', '$1.push($3); $$ = $1;'],
        ],
    };

    let jison_grammar = {
        lex: {
            rules: jison_lex_rules,
        },
        operators: jison_operators,
        bnf: jison_bnf,
    };

    return jison_grammar;
}


module.exports = {
    standard: standard(),
};
