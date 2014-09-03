var gulp = require('gulp')

gulp.task('default', ['watch'])

gulp.task('watch', ['browserify', 'jison'], function() {
  gulp.watch(['lib/parser/*.jison'], ['jison'])
  gulp.watch(['lib/**/*.js'], ['browserify'])
})

var testem = require('testem')
gulp.task('test', ['browserify'], function (done) {
  var t = new testem()
  return t.startCI({
    test_page: 'test/runner.html',
    launch: 'Chrome'
  })
})

var browserify = require('browserify')
var source     = require('vinyl-source-stream')
gulp.task('browserify', function() {
  return browserify({ entries: './lib/index.js', standalone: 'epoxy' })
      .bundle()
      .pipe(source('epoxy.js'))
      .pipe(gulp.dest('./'))
})

var spawn = require('child_process').spawn
gulp.task('jison', function(done) {
  var jison = spawn(
    '../../node_modules/.bin/jison',
    ['parser.jison', '-m commonjs'],
    {
      cwd: './lib/parser',
      stdio: 'inherit'
    }
  )

  jison.on('close', done)
})