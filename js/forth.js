class Forth {
	constructor() {
		this.ops = {};
		this.stack = [];

		/* ====== [STACK OPERATIONS] ====== */
		this.ops['dup'] = (th) => {
			th.push(last(th.stack));
		};
		this.ops['drop'] = (th) => {
			this.pop();
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
		let tok = text.split(/\s+/);
		console.log(tok);
		for (let i = 0; i < tok.length; ++i) {
			this.operate(tok[i]);
		}
		return last(this.stack);
	}
}

function last(li) {
	return li[li.length - 1];
}
