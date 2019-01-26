class Display {
	constructor(forth, w, h, t, selector) {
		this.NS = 'http://www.w3.org/2000/svg';
		this.forth = forth;
		this.w = w;
		this.h = h;
		this.t = t;
		this.svg = document.querySelector(selector);
		/* to make things even more compl^W fun let's use cursor for drawing! */
		this.cursor = [0, 0];
		this.export_forth();
	}
	init() {
		for (let r = 0; r < this.h; ++r) {
			for (let c = 0; c < this.w; ++c) {
				let pt = document.createElementNS(this.NS, 'rect');
				pt.setAttributeNS(null, 'x', c * this.t);
				pt.setAttributeNS(null, 'y', r * this.t);
				pt.setAttributeNS(null, 'color', 0);
				pt.setAttributeNS(null, 'width', this.t);
				pt.setAttributeNS(null, 'height', this.t);
				pt.dataset.y = r;
				pt.dataset.x = c;
				this.svg.appendChild(pt);
			}
		}
	}
	/* returns the rect under cursor (point, if you will) */
	pt() {
		let [x, y] = this.cursor;
		return document.querySelector(`svg rect[data-x="${x}"][data-y="${y}"]`);
	}
	mv_cursor(x, y) {
		if (x < 0) x = 0;
		if (y < 0) y = 0;
		if (x >= this.w) x = this.w - 1;
		if (y >= this.h) y = this.h - 1;
		this.cursor = [x, y];
	}
	step_cursor() {
		let [x, y] = this.cursor;
		x += 1;
		if (x >= this.w) { x = 0; y += 1; }
		if (y >= this.h) { y = 0; }
		this.cursor = [x, y];
	}
	export_forth() {
		this.ctx_name = 'disp';
		this.ops = {};
		this.ops['disp-w'] = ({forth: f, disp: d}) => { f.push(d.w); };
		this.ops['disp-h'] = ({forth: f, disp: d}) => { f.push(d.h); };
		this.ops['cur-x'] = ({forth: f, disp: d}) => { f.push(d.cursor[0]); };
		this.ops['cur-y'] = ({forth: f, disp: d}) => { f.push(d.cursor[1]); };
		this.ops['put'] = ({forth: f, disp: d}) => {
			f.chk_underflow(1);
			const c = f.pop();
			d.pt().dataset.color = c;
			//d.step_cursor();
		}
		this.ops['cur-mv'] = ({forth: f, disp: d}) => {
			f.chk_underflow(2);
			const y = f.pop();
			const x = f.pop();
			this.mv_cursor(x, y);
		}
		this.ops['cur-u'] = ({disp: d}) => {
			let [x, y] = d.cursor;
			d.cursor = [x, --y];
		}
		this.ops['cur-d'] = ({disp: d}) => {
			let [x, y] = d.cursor;
			d.cursor = [x, ++y];
		}
		this.ops['cur-l'] = ({disp: d}) => {
			let [x, y] = d.cursor;
			d.cursor = [--x, y];
		}
		this.ops['cur-r'] = ({disp: d}) => {
			let [x, y] = d.cursor;
			d.cursor = [++x, y];
		}
		this.ops['cur-step'] = ({disp: d}) => {
			d.step_cursor();
		}
		// TODO dependency control
		this.ops['.cur'] = ({disp: d, repl: r}) => {
			let [x, y] = d.cursor;
			r.print(`(${x}, ${y})`);
		}
	}
}
