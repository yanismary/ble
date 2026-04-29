var gulp= require("gulp");
var preprocess = require('gulp-preprocess');
 
gulp.task("html", function() {
  gulp
    .src("./app/*.html")
    .pipe(preprocess({ context: { NODE_ENV: "production", DEBUG: true } })) // To set environment variables in-line
    .pipe(gulp.dest("./dist/"));
});
 
gulp.task("scripts", function() {
  gulp
    .src(["./app/*.js"])
    .pipe(preprocess())
    .pipe(gulp.dest("./dist/"));
});
