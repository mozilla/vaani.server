start
  = head m:middle tail { return m; }

head
  = ((polite _)? add _)?

middle
  = i:identifier m:middletail?   { return i + (m ? (' ' + m) : ''); }

middletail
  = _ list endplease?            { return ''; }
  / endplease                    { return ''; }
  / _ i:identifier m:middletail? { return i + (m ? (' ' + m) : ''); }

tail
  = ('.'/'?')?

endplease
  = ','? _ please

list
  = ('to' / 'onto' / 'on') _ ('my' / 'the') (_ shopping)? _ 'list'

shopping
  = 'shopping'
  / 'grocery'

add
  = ('add' / 'tack' / 'tag') _ 'on'
  / 'append'
  / 'add'
  / 'put'

polite
  = would _ 'you' (_ please)?
  / please

would
  = 'would'
  / 'could'
  / 'can'

please
  = 'please'

identifier
  = $(a:[0-9a-zA-Z]+b:[0-9a-zA-Z\-\']*)

_
  = ' '+
