let forth;
let disp;
let repl;

function init() {
	forth = new Forth();
	repl = new REPL(forth, 'log', 'line');
	disp = new Display(forth, 20, 15, 16, '#disp svg');

	forth.modload(repl);
	forth.modload(disp);

	disp.init();

	repl.el_input.focus();
	forth.exec(': sq5 5 dup * ;');
}
