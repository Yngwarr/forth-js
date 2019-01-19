( takes the line number from stack )
: hline 0 swap cur-mv disp-w while dup 0 > do 1 put -- done drop ;

0 hline
disp-h -- hline
