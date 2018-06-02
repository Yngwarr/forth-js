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
		this.ops['nip'] = (th) => {
			th.stack[th.stack.length - 2] = last(th.stack);
			th.pop();
		};
		this.ops['swap'] = (th) => {
			let t = last(th.stack);
			th.stack[th.stack.length - 1] = th.stack[th.stack.length - 2];
			th.stack[th.stack.length - 2] = t;
		}
		this.ops['2swap'] = (th) => {
			let [n4, n3] = th.stack.slice(-2);
			th.stack[th.stack.length - 1] = th.stack[th.stack.length - 3];
			th.stack[th.stack.length - 2] = th.stack[th.stack.length - 4];
			th.stack[th.stack.length - 3] = n3;
			th.stack[th.stack.length - 4] = n4;
		}
		// rotates stack left [1,2,3] -> [2,3,1]
		this.ops['rol'] = (th) => {
			let num = th.pop();
			let head = th.stack.splice(num);
			th.stack = head.concat(th.stack);
		}
		// rotates stack right [1,2,3] -> [3,1,2]
		this.ops['ror'] = (th) => {
			let num = th.pop();
			let tail = th.stack.splice(-num);
			th.stack = tail.concat(th.stack);
		}
		this.ops['.'] = (th) => {
			console.log(last(th.stack));
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
		this.ops['++'] = (th) => { th.stack[th.stack.length-1]++; };
		this.ops['--'] = (th) => { th.stack[th.stack.length-1]--; };
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
		this.ops['while'] = (th) => {
			let tok;
			let cond = [];
			let body = [];
			while ((tok = th.next_cmd()) !== 'do') {
				cond.push(tok);
			}
			cond = th.compile(cond);
			while ((tok = th.next_cmd()) !== 'done') {
				body.push(tok);
			}
			body = th.compile(body);
			// actual while body. Damn, it's so C!
			while (cond(th), last(th.stack)) {
				body(th);
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
