const forth = new Forth();

function init()
{
	forth.exec(`2 8 +
		9 2 2 + *`);
}
