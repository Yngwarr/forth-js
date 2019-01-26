class REPL {
	constructor(forth, log_id, line_id) {
		this.forth = forth;
		this.el_log = document.getElementById(log_id);
		this.el_input = document.querySelector(`#${line_id} > input`);
		this.el_prompt = document.querySelector(`#${line_id} > span`);
		this.el_anchor = document.querySelector(`#${log_id} + .anchor`);

		let th = this;
		this.el_input.addEventListener('keydown', (e) => {
			if (e.key === 'l' && e.ctrlKey) {
				th.el_log.textContent = '';
				e.preventDefault();
			}
		});
		this.el_input.addEventListener('keyup', (e) => {
			if (e.key !== 'Enter') return;
			if (th.el_input.value === '') return;
			th.exec(th.el_input.value);
			th.el_anchor.scrollIntoView(false);
			th.el_input.value = '';
		});

		this.export_forth();
		this.print("FORTH.js or whatever\nMade by me not so far ago.");
	}
	print(line) {
		this.el_log.textContent += `${line}\n`;
	}
	exec(line) {
		this.print(`${this.el_prompt.textContent}${line}`);
		try {
			this.forth.exec(line);
		} catch (e) {
			this.print(`${e.name}: ${e.message}`);
		}
	}
	export_forth() {
		this.ctx_name = 'repl';
		this.ops = {};
		this.ops['.'] = ({forth: f, repl: r}) => {
			let p = last(f.stack);
			p = p === undefined ? '' : p;
			r.print(p);
		}
		this.ops['.s'] = ({forth: f, repl: r}) => {
			let st = f.stack.map(el => el.toString()).join(' ');
			r.print(`<${f.stack.length}> ${st}`);
		}
		this.ops['."'] = ({forth: f, repl: r}) => {
			let str = [];
			let tok;
			while (true) {
				tok = f.next_cmd();
				if (tok === '"') break;
				str.push(tok);
			}
			// clear the '"' word
			//f.next_cmd();
			r.print(str.join(' '));
		}
	}
}
