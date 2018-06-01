class Forth {
	constructor() {
		this.ops = {};
		this.stack = [];
		this.prog = [];

		/* ====== [STACK OPERATIONS] ====== */
		this.ops['dup'] = (th) => {
			th.push(last(th.stack));
		};
		this.ops['drop'] = (th) => {
			this.pop();
		};
		/* ====== [COMMENT] ====== */
		this.ops['('] = (th) => {
			let tok = '(';
			while (tok !== ')') {
				tok = this.next_cmd();
			}
		};
		/* ====== [ARITHMETICS] ====== */
		this.ops['+'] = (th) => { th.push(th.pop() + th.pop()); };
		this.ops['-'] = (th) => { th.push(th.pop() - th.pop()); };
		this.ops['*'] = (th) => { th.push(th.pop() * th.pop()); };
		this.ops['/'] = (th) => { th.push(th.pop() / th.pop()); };
		this.ops['%'] = (th) => { th.push(th.pop() % th.pop()); };
		this.ops['**'] = (th) => { th.push(th.pop() ** th.pop()); };
		/* ====== [LOGIC] ====== */
		this.ops['&&'] = (th) => { th.push(th.pop() && th.pop()); };
		this.ops['||'] = (th) => { th.push(th.pop() || th.pop()); };
		this.ops['>'] = (th) => { th.push(th.pop() > th.pop()); };
		this.ops['<'] = (th) => { th.push(th.pop() < th.pop()); };
		this.ops['=='] = (th) => { th.push(th.pop() === th.pop()); };
		this.ops['!='] = (th) => { th.push(th.pop() !== th.pop()); };
		this.ops['not'] = (th) => { th.push(!th.pop()); };
		/* ====== [BRANCHING] ====== */
		this.ops['if'] = (th) => {
			let tok;
			if (this.pop()) {
				// condition is true
				while (true) {
					tok = this.next_cmd();
					if (tok === 'else') break;
					if (tok === 'then') return;
					this.operate(tok);
				}
				// else
				while (this.next_cmd() !== 'then');
			} else {
				// condition is false
				while (true) {
					tok = this.next_cmd();
					if (tok === 'else') break;
					if (tok === 'then') return;
				}
				// else
				while (true) {
					tok = this.next_cmd();
					if (tok === 'then') return;
					this.operate(tok);
				}
			}
		};
	}

	next_cmd(loop) {
		if (!loop && this.end()) throw new Error('Unexpected end of program.');
		return this.prog.pop();
	}

	end() {
		return this.prog.length === 0;
	}

	pop() {
		if (this.stack.length === 0) throw new Error('Stack underflow.');
		return this.stack.pop();
	}

	push(val) {
		this.stack.push(val);
	}

	is_op(op) {
		return Object.keys(this.ops).includes(op);
	}

	operate(tok) {
		if (this.is_op(tok)) {
			this.ops[tok](this);
		} else {
			if (!(tok.match(/^\d+$/) || tok.match(/^0x[0-9a-fA-F]+$/)))
				throw new Error(`Unknown word: '${tok}'.`);
			this.push(parseInt(tok));
		}
	}

	exec(text) {
		this.prog = text.split(/\s+/).reverse();
		this.prog = this.prog.map((el) => { return el.toLowerCase(); });
		while (this.prog.length) {
			let tok = this.next_cmd(true);
			this.operate(tok);
		}
		console.log(this.stack);
		//return last(this.stack);
	}
}

function last(li) {
	return li[li.length - 1];
}
