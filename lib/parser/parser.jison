%lex /* lexical grammar */

%x glue

%%

[^\x00]*?/("{{")
    {
        this.begin('glue')
        if (yytext) return 'TEXT'
    }

[^\x00]+
    {
        return 'TEXT';
    }

<glue>\s+
    /* skip whitespace */


<glue>'as'
    {
        return 'AS';
    }

<glue>[^\{\}\.\s]+
    {
        return 'IDENTIFIER';
    }

<glue>'{{'
    {
        return 'OPEN';
    }

<glue>'}}'
    {
        this.begin('INITIAL')
        return 'CLOSE';
    }

<glue>'.'
    {
        return 'DOT';
    }

<INITIAL,glue><<EOF>>
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
    | OPEN statement CLOSE
        { $$ = new yy.Expression(new yy.Path($statement)) }
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