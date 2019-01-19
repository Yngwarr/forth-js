class REPL {
	constructor(log_id, line_id) {
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
			th.print(th.el_input.value);
			th.el_anchor.scrollIntoView(false);
			th.el_input.value = '';
		});

		this.export_forth();
		this.print("FORTH.js or whatever\nMade by me not so far ago.");
	}
	print(line) {
		this.el_log.textContent += `${line}\n`;
	}
	export_forth() {
		this.ctx_name = 'repl';
		this.ops = {};
		this.ops['.'] = ({forth: f, repl: r}) => {
			r.print(last(f.stack) || '');
		}
		this.ops['.s'] = ({forth: f, repl: r}) => {
			let st = f.stack.map(el => el.toString()).join(' ');
			r.print(`<${f.stack.length}> ${st}`);
		}
	}
}