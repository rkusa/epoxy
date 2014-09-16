%lex /* lexical grammar */

%x epoxy

%%

[^\x00]*?/("{{")
    {
        this.begin('epoxy')
        if (yytext) return 'TEXT'
    }

[^\x00]+
    {
        return 'TEXT';
    }

<epoxy>\s+
    /* skip whitespace */


<epoxy>'as'
    {
        return 'AS';
    }

<epoxy>[^\{\}\.\s\|]+
    {
        return 'IDENTIFIER';
    }

<epoxy>'{{'
    {
        return 'OPEN';
    }

<epoxy>'}}'
    {
        this.begin('INITIAL')
        return 'CLOSE';
    }

<epoxy>'.'
    {
        return 'DOT';
    }

<epoxy>'|'
    {
        return 'FILTER';
    }

<INITIAL,epoxy><<EOF>>
    {
        return 'EOF';
    }

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
    : OPEN statement AS identifier CLOSE
        { $$ = new yy.Expression(new yy.Path($statement), $identifier) }
    | OPEN statement FILTER identifier CLOSE
        { $$ = new yy.Expression(new yy.Path($statement), undefined, $identifier) }
    | OPEN statement CLOSE
        { $$ = new yy.Expression(new yy.Path($statement)) }
    | OPEN CLOSE
        { $$ = new yy.Expression(new yy.Path([])) }
    | TEXT
        { $$ = new yy.Text($1) }
    ;

statement
    : statement DOT identifier
        { $statement.push($identifier); $$ = $statement }
    | identifier
        { $$ = [$identifier] }
    ;

identifier
    : IDENTIFIER
        { $$ = $1 }
    ;