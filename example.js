var connect = require('connect')
  , imageResizer = require('./index.js')

var server = connect.createServer(
  imageResizer(__dirname + '/public', {
    'sepia': function(gm, source, target, w, h, finish) {
      gm(source)
        .resize(w, h)
        .sepia()
        .write(target, finish)
    }
  })
, connect.static(__dirname + '/public')
)

server.listen(8080, 'localhost')

console.log('Server started on port 8080')
