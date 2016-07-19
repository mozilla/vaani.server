start
  = head m:middle tail { return m; }

head
  = ((polite _)? add _)?

tail
  = ((_ / (',' _?)) please)? ('.'/'?')?

middle
  = list { return ''; }
  / i:identifier m:middlea? { return i + (m ? (' ' + m) : ''); }

middlea
  = _ m:middle { return m; }

list
  = 'to' _ ('my' / 'the') (_ shopping)? _ 'list'

shopping
  = 'shopping'
  / 'grocery'

add
  = ('add' / 'tack' / 'tag') _ 'on'
  / 'append'
  / 'add'

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
  = (a:[0-9a-zA-Z]+b:[0-9a-zA-Z\-\']*) { return a.concat(b).join(''); }

_
  = ' '+
