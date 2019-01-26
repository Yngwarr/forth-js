( takes the line number from stack )
: hline 0 swap cur-mv disp-w while dup 0 > do 1 put cur-r -- done drop ;
( takes the column number from stack )
: vline 0 cur-mv disp-h while dup 0 > do 1 put cur-d -- done drop ;

( borders )
0 hline
disp-h -- hline
0 vline
disp-w -- vline
