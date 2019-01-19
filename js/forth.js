class Forth {
	constructor() {
		this.ops = {};
		this.stack = [];
		this.prog = [];
		this.ctxs = { forth: this };
		this.export_forth();
	}
	/* 
	 * Underflow-aware version of this.prog.pop().
	 * Pass true to be unaware again (used in exec).
	 */
	next_cmd(loop) {
		if (!loop && this.end()) {
			throw new Error('Unexpected end of the program.');
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
	 */
	operate(tok) {
		if (this.is_op(tok)) {
			this.ops[tok](this.ctxs);
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
				fun.push(`ctx.forth.ops['${op}'](ctx);`);
			} else {
				if (!is_num(op)) {
					throw new Error(`Unknown word: '${op}'.`);
				}
				fun.push(`ctx.forth.push(${parseInt(op)});`);
			}
		}
		fun = `(ctx) => { ${fun.join(' ')} }`;
		return eval(fun);
	}
	/* loads a module with functions and context */
	modload(module) {
		if (module.ctx_name === undefined) {
			throw new Error('No ctx_name given, make sure your module exports it.');
		}
		if (module.ops === undefined) {
			throw new Error('No ops given, make sure your module exports it.');
		}
		this.ctxs[module.ctx_name] = module;
		let mops = module.ops;
		for (let n in mops) {
			if (Object.keys(this.ops).includes(n)) {
				console.warn(`Module ${module.ctx_name} overwrites ${n}.`);
			}
			this.ops[n] = mops[n];
		}
	}
	/* returns a list of loaded modules, handy for dependency management */
	mods() {
		return Object.keys(this.ctxs);
	}
	/* throws an exception on stack underflow */
	chk_underflow(n) {
		n = n || 1;
		if (this.stack.length < n) {
			throw new Error('Stack underflow' + (n === 1 ? '.'
					: `, expected at least ${n} elements.`));
		}
	}
	export_forth() {
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
		this.ops['('] = ({forth: f}) => {
			let tok = '(';
			while (tok !== ')') {
				tok = this.next_cmd();
			}
		};
		/* ====== [STACK OPERATIONS] ====== */
		this.ops['dup'] = ({forth: f}) => {
			f.chk_underflow(1);
			f.push(last(f.stack));
		};
		this.ops['2dup'] = ({forth: f}) => {
			f.chk_underflow(2);
			f.stack = f.stack.concat(f.stack.slice(-2));
		};
		this.ops['drop'] = ({forth: f}) => {
			f.pop();
		};
		this.ops['nip'] = ({forth: f}) => {
			f.chk_underflow(2);
			f.stack[f.stack.length - 2] = last(f.stack);
			f.pop();
		};
		this.ops['swap'] = ({forth: f}) => {
			f.chk_underflow(2);
			let t = last(f.stack);
			f.stack[f.stack.length - 1] = f.stack[f.stack.length - 2];
			f.stack[f.stack.length - 2] = t;
		}
		this.ops['2swap'] = ({forth: f}) => {
			f.chk_underflow(4);
			let [n4, n3] = f.stack.slice(-2);
			f.stack[f.stack.length - 1] = f.stack[f.stack.length - 3];
			f.stack[f.stack.length - 2] = f.stack[f.stack.length - 4];
			f.stack[f.stack.length - 3] = n3;
			f.stack[f.stack.length - 4] = n4;
		}
		// rotates stack left [1,2,3] -> [2,3,1]
		this.ops['rol'] = ({forth: f}) => {
			if (f.stack.length < 2) return;
			let num = f.pop();
			let head = f.stack.splice(num);
			f.stack = head.concat(f.stack);
		}
		// rotates stack right [1,2,3] -> [3,1,2]
		this.ops['ror'] = ({forth: f}) => {
			if (f.stack.length < 2) return;
			let num = f.pop();
			let tail = f.stack.splice(-num);
			f.stack = tail.concat(f.stack);
		}
		/* ====== [ARITHMETICS] ====== */
		this.ops['+'] = ({forth: f}) => {
			f.chk_underflow(2);
			f.push(f.pop() + f.pop());
		};
		this.ops['-'] = ({forth: f}) => {
			f.chk_underflow(2);
			let n = f.pop();
			f.push(f.pop() - n);
		};
		this.ops['*'] = ({forth: f}) => {
			f.chk_underflow(2);
			f.push(f.pop() * f.pop());
		};
		this.ops['/'] = ({forth: f}) => {
			f.chk_underflow(2);
			let n = f.pop();
			f.push(f.pop() / n);
		};
		this.ops['%'] = ({forth: f}) => {
			f.chk_underflow(2);
			let n = f.pop();
			f.push(f.pop() % n);
		};
		this.ops['**'] = ({forth: f}) => {
			f.chk_underflow(2);
			let n = f.pop();
			f.push(f.pop() ** n);
		};
		this.ops['++'] = ({forth: f}) => {
			f.chk_underflow(1);
			f.stack[f.stack.length-1]++;
		};
		this.ops['--'] = ({forth: f}) => {
			f.chk_underflow(1);
			f.stack[f.stack.length-1]--;
		};
		/* ====== [LOGIC] ====== */
		this.ops['&&'] = ({forth: f}) => {
			f.chk_underflow(2);
			f.push(f.pop() && f.pop());
		};
		this.ops['||'] = ({forth: f}) => {
			f.chk_underflow(2);
			f.push(f.pop() || f.pop());
		};
		this.ops['>'] = ({forth: f}) => {
			f.chk_underflow(2);
			let n = f.pop();
			f.push(f.pop() > n);
		};
		this.ops['<'] = ({forth: f}) => {
			f.chk_underflow(2);
			let n = f.pop();
			f.push(f.pop() < n);
		};
		this.ops['=='] = ({forth: f}) => {
			f.chk_underflow(2);
			f.push(f.pop() === f.pop());
		};
		this.ops['!='] = ({forth: f}) => {
			f.chk_underflow(2);
			f.push(f.pop() !== f.pop());
		};
		this.ops['not'] = ({forth: f}) => {
			f.chk_underflow(1);
			f.push(!f.pop());
		};
		/* ====== [BRANCHING] ====== */
		this.ops['if'] = ({forth: f}) => {
			f.chk_underflow(1);
			let tok;
			if (f.pop()) {
				// condition is true
				while (true) {
					tok = f.next_cmd();
					if (tok === 'else') break;
					if (tok === 'then') return;
					f.operate(tok);
				}
				// else
				while (f.next_cmd() !== 'then');
			} else {
				// condition is false
				while (true) {
					tok = f.next_cmd();
					if (tok === 'else') break;
					if (tok === 'then') return;
				}
				// else
				while (true) {
					tok = f.next_cmd();
					if (tok === 'then') return;
					f.operate(tok);
				}
			}
		};
		this.ops['while'] = (ctx) => {
			const f = ctx.forth;
			let tok;
			let cond = [];
			let body = [];
			while ((tok = f.next_cmd()) !== 'do') {
				cond.push(tok);
			}
			cond = f.compile(cond);
			while ((tok = f.next_cmd()) !== 'done') {
				body.push(tok);
			}
			body = f.compile(body);
			// actual while body. Damn, it's so C!
			//while (cond(ctx), last(f.stack)) {
			while (cond(ctx), f.pop()) {
				body(ctx);
			}
		};
		/* ====== [FUNCTIONS] ====== */
		this.ops[':'] = ({forth: f}) => {
			let name = f.next_cmd();
			if (is_num(name)) {
				throw new Error('Cannot use a number as a name.');
			}
			f.ops[name] = read_fn(f);
		};
		this.ops[':noname'] = ({forth: f}) => { f.push(read_fn(f)); };
		this.ops['execute'] = ({forth: f}) => { f.pop()(f); }
	}
}

function last(li) {
	return li[li.length - 1];
}

function is_num(tok) {
	return tok.match(/^\d+$/) || tok.match(/^0x[0-9a-fA-F]+$/);
}
