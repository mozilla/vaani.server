/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* Description:
   Parses shopping list commands. The main rule (S) returns the name
   of the item that should be added to the list.
*/

/* lexical grammar */
%lex

%%

\s+                            /* skip whitespace */
[a-zA-Z\']+                    return yytext;
"."                            return "DOT";
<<EOF>>                        return "EOF";

/lex

%start S

%% /* language grammar */

 S  : SC DOT EOF               { return $1; }
    | SC EOF
    ;

 SC	: MD "you" "please" VP     { return $4; }
	| MD "you" VP              { return $3; }
	| "please" VP              { return $2; }
	| VP                       { return $1; }
	| NP                       { return $1; }
    ;

 MD	: "could"
	| "can"
	| "would"
    ;

 VP	: VB NP PP                 { return $2; }
	| VB NP "please"           { return $2; }
	| VB NP                    { return $2; }
    ;

 VB	: "add"
	| "append"
	| "add" "on"
	| "tag" "on"
	| "tack" "on"
    ;

 PP	: "to" "my" "shopping" "list"
	| "to" "my" "shopping" "list" "please"
	| "to" "my" "list"
	| "to" "my" "list" "please"
	| "to" "my" "grocery" "list"
	| "to" "my" "grocery" "list" "please"
    ;
