const forth = new Forth();

function init()
{
	forth.exec(`: sq5 5 dup * ;`);
}
