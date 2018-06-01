class Forth {
	constructor() {
		this.ops = {};
		this.stack = [];
		this.prog = [];

		// used by : and :noname
		let read_fn = (th) => {
			let prog = [];
			let op;
			while (true) {
				op = th.next_cmd();
				if (op === ';') break;
				prog.push(op);
			}
			return th.compile(prog);
		};

		/* ====== [COMMENT] ====== */
		this.ops['('] = (th) => {
			let tok = '(';
			while (tok !== ')') {
				tok = this.next_cmd();
			}
		};
		/* ====== [STACK OPERATIONS] ====== */
		this.ops['dup'] = (th) => {
			th.push(last(th.stack));
		};
		this.ops['drop'] = (th) => {
			th.pop();
		};
		this.ops['.'] = (th) => {
			console.log(th.pop());
		}
		this.ops['.s'] = (th) => {
			let st = this.stack.map((el) => {return el.toString();}).join(' ');
			console.log(`<${this.stack.length}> ${st}`);
		}
		/* ====== [ARITHMETICS] ====== */
		this.ops['+'] = (th) => { th.push(th.pop() + th.pop()); };
		this.ops['-'] = (th) => {
			let n = th.pop();
			th.push(th.pop() - n);
		};
		this.ops['*'] = (th) => { th.push(th.pop() * th.pop()); };
		this.ops['/'] = (th) => {
			let n = th.pop();
			th.push(th.pop() / n);
		};
		this.ops['%'] = (th) => {
			let n = th.pop();
			th.push(th.pop() % n);
		};
		this.ops['**'] = (th) => {
			let n = th.pop();
			th.push(th.pop() ** n);
		};
		/* ====== [LOGIC] ====== */
		this.ops['&&'] = (th) => { th.push(th.pop() && th.pop()); };
		this.ops['||'] = (th) => { th.push(th.pop() || th.pop()); };
		this.ops['>'] = (th) => {
			let n = th.pop();
			th.push(th.pop() > n);
		};
		this.ops['<'] = (th) => {
			let n = th.pop();
			th.push(th.pop() < n);
		};
		this.ops['=='] = (th) => { th.push(th.pop() === th.pop()); };
		this.ops['!='] = (th) => { th.push(th.pop() !== th.pop()); };
		this.ops['not'] = (th) => { th.push(!th.pop()); };
		/* ====== [BRANCHING] ====== */
		this.ops['if'] = (th) => {
			let tok;
			if (th.pop()) {
				// condition is true
				while (true) {
					tok = th.next_cmd();
					if (tok === 'else') break;
					if (tok === 'then') return;
					th.operate(tok);
				}
				// else
				while (th.next_cmd() !== 'then');
			} else {
				// condition is false
				while (true) {
					tok = th.next_cmd();
					if (tok === 'else') break;
					if (tok === 'then') return;
				}
				// else
				while (true) {
					tok = th.next_cmd();
					if (tok === 'then') return;
					th.operate(tok);
				}
			}
		};
		/* ====== [FUNCTIONS] ====== */
		this.ops[':'] = (th) => {
			let name = th.next_cmd();
			if (is_num(name)) {
				throw new Error('Cannot use a number as a name.');
			}
			th.ops[name] = read_fn(th);
		};
		this.ops[':noname'] = (th) => { th.push(read_fn(th)); };
		this.ops['execute'] = (th) => { th.pop()(th); }
	}
	/* 
	 * Underflow-aware version of this.prog.pop().
	 * Pass true to be unaware again (used in exec).
	 */
	next_cmd(loop) {
		if (!loop && this.end()) {
			throw new Error('Unexpected end of program.');
		}
		return this.prog.pop();
	}
	/* true when the end of program is reached */
	end() {
		return this.prog.length === 0;
	}
	/* underflow-aware shortcut for this.stack.pop() */
	pop() {
		if (this.stack.length === 0) throw new Error('Stack underflow.');
		return this.stack.pop();
	}
	/* shortcut for this.stack.push() */
	push(val) {
		this.stack.push(val);
	}
	/* checks weather the operation is known by an interpreter */
	is_op(op) {
		return Object.keys(this.ops).includes(op);
	}
	/*
	 * Execute a given command. Takes string as a parameter and executes it
	 * if known. Otherwise, converts it to a number and pushes to stack.
	 * */
	operate(tok) {
		if (this.is_op(tok)) {
			this.ops[tok](this);
		} else {
			if (!is_num(tok)) {
				throw new Error(`Unknown word: '${tok}'.`);
			}
			this.push(parseInt(tok));
		}
	}
	/* tokenize and execute a program given as a text */
	exec(text) {
		this.prog = text.split(/\s+/).reverse();
		this.prog = this.prog.map((el) => { return el.toLowerCase(); });
		while (this.prog.length) {
			let tok = this.next_cmd(true);
			this.operate(tok);
		}
		//console.log(this.stack);
	}
	/* creates an executable function from a list of tokens */
	compile(prog) {
		let fun = [];
		prog.reverse();
		while (prog.length !== 0) {
			let op = prog.pop();
			if (this.is_op(op)) {
				fun.push(`th.ops['${op}'](th);`);
			} else {
				if (!is_num(op)) {
					throw new Error(`Unknown word: '${op}'.`);
				}
				fun.push(`th.push(${parseInt(op)});`);
			}
		}
		fun = `(th) => { ${fun.join(' ')} }`;
		return eval(fun);
	}
}

function last(li) {
	return li[li.length - 1];
}

function is_num(tok) {
	return tok.match(/^\d+$/) || tok.match(/^0x[0-9a-fA-F]+$/);
}
