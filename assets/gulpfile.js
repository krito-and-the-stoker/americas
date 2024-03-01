import gulp from 'gulp'
import tap from 'gulp-tap'
import gulpSass from 'gulp-sass'
import * as dartSass from 'sass'
import path from 'path'
import { deleteSync } from 'del'
import fs from 'fs'
import browserSync from 'browser-sync'

const sass = gulpSass(dartSass)


function swallowError (error) {
    console.log(error.toString())
    this.emit('end')
}


gulp.task('sass', () => {
    return gulp.src('scss/**/*.scss')
        .pipe(sass()).on('error', swallowError)
        .pipe(gulp.dest('dist/styles'))
        .pipe(browserSync.stream())
    })
gulp.task('images', () => {
    return gulp.src('images/**/*')
        .pipe(gulp.dest('dist/images'))
})

gulp.task('serve', done => {
    browserSync.init({
        server: {
            baseDir: 'dist',
        },
        open: false
    })

    done()
})


gulp.task('templates', () => {
    const templatesDir = 'templates/**/*'; // Adjust the glob pattern as needed
    const outputDir = 'dist/templates';
    const templates = [];

    return gulp.src(templatesDir)
        .pipe(tap(file => {
            if (file.contents) {
                templates.push(file.contents.toString());
            }
        }))
        .on('end', () => {
            // Write the JSON object to a file at the end of the stream
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(path.join(outputDir, 'index.md'), templates.join('\n'));
        });
});

gulp.task('clean', done => {
    deleteSync(['dist']);
    done()
})

gulp.task('build', gulp.series(gulp.parallel(['clean', 'templates', 'sass', 'images'])))

gulp.task('watch', () => {
    gulp.watch('scss/**/*.scss', gulp.series('sass'))
    gulp.watch('images/**/*', gulp.series('images'))
    gulp.watch('templates/**/*', gulp.series('templates'))
})

gulp.task('default', gulp.series('clean', 'serve', 'build', 'watch'))
