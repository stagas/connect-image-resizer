//
// Connect Image Resizer
//
// George Stagas <gstagas@gmail.com>
//
// MIT Licenced
//

var fs = require('fs')
  , parseUrl = require('url').parse
  , path = require('path')
  , gm = require('gm')

var defaultResize = function(gm, source, target, w, h, finish) {
  gm(source)
    .resize(w, h)
    .write(target, finish)
}

var resize = {
  normal: defaultResize
, fill: function(gm, source, target, w, h, finish) {
    gm(source)
      .arg(['-gravity', 'center'])
      .arg(['-resize', w + 'x' + h + '^'])
      .crop(w, h)
      .write(target, finish)
  }
}

module.exports = function(root, custom) {
  for (var k in custom) {
    if (custom.hasOwnProperty(k))
      resize[k] = custom[k]
  }
  return function(req, res, next) {
    if (req.method != 'GET' && req.method != 'HEAD') return next()
    
    var url = parseUrl(req.url, true)
      , filename = decodeURIComponent(url.pathname)
      , w = Math.abs(parseInt(url.query.w || url.query.width, 10))
      , h = Math.abs(parseInt(url.query.h || url.query.height, 10))
      , type = url.query.t || url.query.type
    
    var resizeMethod = (typeof resize[type] === 'function') && resize[type] || (type = 'normal') && defaultResize

    if (isNaN(w) || isNaN(h) || !w || !h) return next()

    // Potentially malicious path
    if (~filename.indexOf('..')) {
      return next() // We don't need to handle it
    }

    // Absolute path
    var source = path.join(root, filename)

    fs.stat(source, function(err, stat) {

      // Pass through for missing files, throw error for other problems
      if (err) {
        return err.errno === process.ENOENT
          ? next()
          : next(err)
      } else if (stat.isDirectory()) {
        return next()
      }

      var targetDir = path.join(path.dirname(source), w + 'x' + h + '_' + type)
        , target = path.join(targetDir, path.basename(source))

      var finish = function(err) {
        if (!err) req.url = target.substr(root.length)
        next()
      }

      path.exists(targetDir, function(exists) {
        if (!exists) try { fs.mkdirSync(targetDir, 0755) } catch(e) {} // sorry
        path.exists(target, function(exists) {
          if (exists) return finish()
          resizeMethod(gm, source, target, w, h, finish)
        })
      })
    })
  }
}
