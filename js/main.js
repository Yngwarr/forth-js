let forth;
let disp;
let repl;

function init() {
	forth = new Forth();
	disp = new Display(320, 240, 16);
	repl = new REPL('log', 'line');

	forth.modload(repl);

	repl.el_input.focus();
	forth.exec(': sq5 5 dup * ;');
}
