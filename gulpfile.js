'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var fs = require('fs');
var path = require('path');
var del = require('del');
var merge = require('merge-stream');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var AUTOPREFIXER_BROWSERS = [
  'ie >= 8',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

// gulp-plumber error handler; won't break the watch-stream
var errorHandler = {
  errorHandler: function (err) {
    console.log(err.toString());
    this.emit('end');
  }
};

// Helper to get all subdirs of a dir
function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    });
}

// Helper to get all file prefixes. Delimiter is the first _ (underscore).
function getFileGroups(dir) {
  var alreadyReturned = [];
  return fs.readdirSync(dir)
    .map(function (file) {
      var prefix = file.split('_')[0];
      if ( alreadyReturned.indexOf(prefix) === -1) {
        alreadyReturned.push(prefix);
        return prefix;
      }
    });
}


// Build Styles
gulp.task('styles', function() {
  return gulp.src('static/sass/**/*.scss')
    .pipe($.plumber(errorHandler))
    .pipe($.sass({
      outputStyle: 'expanded',
      sourceComments: true
    }))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('assets/css'))
    .pipe(reload({ stream: true }))
    .pipe($.minifyCss())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest('assets/css'))
    .pipe(reload({ stream: true }))
    .pipe($.bless())
    .pipe(gulp.dest('assets/css/split/'))
    .pipe(reload({ stream: true }));
});


// Build JavaScript
gulp.task('js', function() {
  return gulp
    .src('static/js/*.js')
    .pipe($.plumber(errorHandler))
    .pipe($.include())
    .pipe($.jshint())
    .pipe(gulp.dest('assets/js'))
    .pipe($.uglify())
    .pipe($.rename({ suffix: '.min' }))
    .pipe(gulp.dest('assets/js'))
    .pipe(reload({ stream: true }));
});


/* SVG Min & Map
 * Note: This creates a svgmap _for each directory_ in static/svg.
 * Also it will add the directory name as a prefix for the svg symbol IDs
 * in order to ensure unique symbol IDs.
============================== */
gulp.task('svg', function() {
  var folders = getFolders('static/svg');
  var tasks = folders.map(function (folder) {
    var name = "";

    return gulp
      .src('static/svg/' + folder + '/*.svg', { base: 'static/svg' })
      .pipe($.plumber(errorHandler))
      .pipe($.rename(function (path) {
        name = folder;
        path.basename = folder + '-' + path.basename;
      }))
      .pipe($.svgmin())
      .pipe($.svgstore())
      .pipe($.rename(function (path) {
        path.basename = 'map-' + name;
        path.extname = '.svg';
      }))
      .pipe(gulp.dest('assets/svg'));
  });

  return merge(tasks);
});


/* SVG to PNGSprite
============================== */
gulp.task('svg2png', function() {
  var folders = getFolders('static/svg');
  var tasks = folders.map(function (folder) {

    return gulp
      .src('static/svg/' + folder + '/*.svg')
      .pipe($.raster({format: 'png'}))
      .pipe($.rename(function (path) {
        path.basename = "map-" + folder + ".svg." + folder + "-" + path.basename;
        path.extname = ".png";
      }))
      .pipe(gulp.dest('assets/img'));

  });

  return merge(tasks);
});


/* Image Optimization
 * Currently not in use.
============================== *//*
gulp.task('img', function() {
  return gulp.src('static/img/*')
    .pipe(imagemin())
    .pipe(gulp.dest('static/img/build'));
}); */


/* Retina Image sprites
============================== */
gulp.task('sprites', function () {
  return gulp.src('static/img/sprites/**/*.png')
    .pipe($.spritesmith({
      retinaSrcFilter: 'static/img/sprites/**/*-2x.png',
      retinaImgName: 'sprite-2x.png',
      retinaImgPath: '/assets/img/sprite-2x.png',
      imgName: 'sprite.png',
      imgPath: '/assets/img/sprite.png',
      cssName: '_sprite.scss',
      padding: 5,
      cssTemplate: './sprite-scss.hbs',
      cssVarMap: function (sprite) {
        var group = sprite.source_image.split(path.sep);
        var groupname = group[group.length-2];
        sprite.name = 'sprite-' + groupname + '-' + sprite.name.substring(0, sprite.name.length - 3);
      }
    }))
    .pipe($.if('*.png', gulp.dest('assets/img')))
    .pipe($.if('*.scss', gulp.dest('assets/sass')));
});



/* Watch
============================== */
gulp.task('watch', function() {
  $.watch('static/sass/**/*.scss', $.batch(function (events, done) {
    gulp.start('styles', done);
  }));
  $.watch('static/js/**/*.js', $.batch(function (events, done) {
    gulp.start('js', done);
  }));
  gulp.watch('**/*.html').on('change', reload);
});


/* Rev (asset-pipeline)
 * Only for production
==============================
gulp.task('rev', function() {
  return gulp.src(['static/build/css/*.css', 'static/build/js/*.js'])
    .pipe(rev())
    .pipe(gulp.dest('static/dist'))
    .pipe(rev.manifest({
      path: 'static.json'
    }))
    .pipe(gulp.dest('static/dist'));
}); */


/* Clean builded files
============================== */
gulp.task('clean', function(cb) {
  runSequence(['clean:css', 'clean:js', 'clean:svg', 'clean:sprites'], cb);
});

gulp.task('clean:css', function(cb) {
  del(['assets/css/**/*.css'], cb);
});

gulp.task('clean:js', function(cb) {
  del(['assets/js/*.js'], cb);
});

gulp.task('clean:svg', function(cb) {
  del(['assets/svg/*.svg', 'assets/svg/*.png'], cb);
  $.util.log('Remember to run svg AND svg2png tasks.');
});

gulp.task('clean:sprites', function(cb) {
  del(['assets/img/sprite*.png', 'assets/sass/_sprite.scss'], cb);
});


/* Default task
============================== */
gulp.task('default', ['clean:css', 'clean:js', 'clean:svg', 'clean:sprites', 'sprites'], function(callback) {
  runSequence(['styles', 'js', 'svg', 'svg2png'], callback);
});
