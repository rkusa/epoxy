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
    : OPEN statement 'as' alias filters CLOSE
        { $$ = new yy.Expression(new yy.Path($statement), $alias, $filters) }
    | OPEN statement 'as' alias CLOSE
        { $$ = new yy.Expression(new yy.Path($statement), $alias) }
    | OPEN statement filters CLOSE
        { $$ = new yy.Expression(new yy.Path($statement), undefined, $filters)}
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

alias
    : identifier ',' identifier
        { $$ = [$1, $3] }
    | identifier
        { $$ = $identifier }
    ;

identifier
    : IDENTIFIER
        { $$ = $1 }
    ;

filters
    : filters filter
        { $filters.push($filter); $$ = $filters }
    | filter
        { $$ = [$filter] }
    ;

filter
    : '|' identifier '(' arguments ')'
        { $$ = new yy.Filter($identifier, $arguments) }
    | '|' identifier
        { $$ = new yy.Filter($identifier) }
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
