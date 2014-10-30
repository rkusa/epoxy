%lex /* lexical grammar */

%x epoxy

%%

[^\x00]*?/("{{")        { this.begin('epoxy')
                          if (yytext) return 'TEXT' }
[^\x00]+                { return 'TEXT'; }

<epoxy>\s+              /* skip whitespace */
<epoxy>'as'             { return 'as' }
<epoxy>(?!\d)[^\{\}\.\,\s\|\\'\(\)]+ { return 'IDENTIFIER' }
<epoxy>'{{'             { return 'OPEN' }
<epoxy>'}}'             { this.begin('INITIAL')
                          return 'CLOSE' }
<epoxy>'.'              { return '.' }
<epoxy>','              { return ',' }
<epoxy>'|'              { return '|' }
<epoxy>'('              { return '(' }
<epoxy>')'              { return ')' }
<epoxy>[\']             { return 'QUOTE' }
<epoxy>\d+              { return 'NUMBER' }

<INITIAL,epoxy><<EOF>>  { return 'EOF' }

/lex

%start expression

%% /* language grammar */

expression
    : body EOF
        { return new yy.Program($body) }
    | EOF
        { return new yy.Program() }
    ;

body
    : parts
        { $$ = $parts }
    ;

parts
    : parts part
        { $parts.push($part); $$ = $parts }
    | part
        { $$ = [$part] }
    ;

part
    : OPEN statement 'as' identifier '|' identifier '(' arguments ')' CLOSE
        { $$ = new yy.Expression(new yy.Path($2), $4, new yy.Filter($6, $8)) }
    | OPEN statement 'as' identifier '|' identifier  CLOSE
        { $$ = new yy.Expression(new yy.Path($2), $4, new yy.Filter($6)) }
    | OPEN statement 'as' identifier CLOSE
        { $$ = new yy.Expression(new yy.Path($statement), $identifier) }
    | OPEN statement '|' identifier '(' arguments ')' CLOSE
        { $$ = new yy.Expression(new yy.Path($statement), undefined, new yy.Filter($identifier, $arguments))}
    | OPEN statement '|' identifier CLOSE
        { $$ = new yy.Expression(new yy.Path($statement), undefined, new yy.Filter($identifier)) }
    | OPEN statement CLOSE
        { $$ = new yy.Expression(new yy.Path($statement)) }
    | OPEN CLOSE
        { $$ = new yy.Expression(new yy.Path([])) }
    | TEXT
        { $$ = new yy.Text($1) }
    ;

statement
    : path
        { $$ = $path }
    ;

path
    : path '.' identifier
        { $path.push($identifier); $$ = $path }
    | identifier
        { $$ = [$identifier] }
    ;

identifier
    : IDENTIFIER
        { $$ = $1 }
    ;

arguments
    : arguments ',' argument
        { $arguments.push($argument); $$ = $arguments }
    | argument
        { $$ = [$argument] }
    ;

argument
    : string
        { $$ = $1}
    | number
        { $$ = $1}
    | path
        { $$ = new yy.Path($path) }
    ;

string
    : QUOTE identifier QUOTE
        { $$ = $identifier }
    ;

number
    : NUMBER
        { $$ = parseFloat($1, 10) }
    ;
