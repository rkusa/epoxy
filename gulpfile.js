var gulp = require('gulp')
var karma = require('karma').server

gulp.task('default', ['watch'])

gulp.task('watch', ['browserify', 'jison'], function() {
  gulp.watch(['lib/parser/*.jison'], ['jison'])
  gulp.watch(['lib/**/*.js'], ['browserify'])
})

gulp.task('test', function () {
  return gulp.src('test/runner.html')
             .pipe(require('gulp-mocha-phantomjs')())
})

// gulp.task('test', function (done) {
//   karma.start({
//     configFile: __dirname + '/karma.conf.js',
//     singleRun: true
//   }, done)
// })

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