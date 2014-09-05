/*eslint no-process-exit: 0*/

var gulp = require('gulp')

gulp.task('default', ['watch'])

gulp.task('watch', ['browserify', 'jison'], function() {
  gulp.watch(['lib/parser/*.jison'], ['jison'])
  gulp.watch(['lib/**/*.js'], ['browserify'])
})

gulp.task('test', ['lint', 'testem'], function() {
  setImmediate(function() {
    process.exit(0)
  })
})

var Testem = require('testem')
gulp.task('testem', ['browserify'], function (done) {
  var t = new Testem()
  t.startCI({
    'test_page': 'test/runner.html',
    launch: 'Chrome'
  }, done)
})

var browserify = require('browserify')
var source     = require('vinyl-source-stream')
gulp.task('browserify', function() {
  return browserify({ entries: './lib/index.js', standalone: 'epoxy' })
      .bundle()
      .pipe(source('epoxy.js'))
      .pipe(gulp.dest('./dist'))
})

var eslint = require('gulp-eslint')
gulp.task('lint', function() {
  return gulp.src(['!lib/parser/parser.js', 'lib/**/*.js', 'test/**/*.js', 'gulpfile.js'])
             .pipe(eslint())
             .pipe(eslint.format())
             .pipe(eslint.failOnError())
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
