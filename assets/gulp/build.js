const gulp = require('gulp')
const tap = require('gulp-tap');
const sass = require('gulp-sass')(require('sass'))
const path = require('path')
const jimp = require('jimp')
const fs = require('fs')
const browserSync = require('browser-sync').create()

function swallowError (error) {
	console.log(error.toString())
	this.emit('end')
}


gulp.task('static', () => {
	return gulp.src('src/static/**/*')
		.pipe(gulp.dest('dist'))
})

gulp.task('sass', () => {
	return gulp.src('src/sass/**/*.scss')
		.pipe(sass()).on('error', swallowError)
		.pipe(gulp.dest('dist/styles'))
		.pipe(browserSync.stream())
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

gulp.task('assets', resolve => {
	const images = 142
	const cols = 13
	const base = 128
	const pad = (n, width, z) => {
		z = z || '0'
		n = n + ''
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
	}
	const position = (index) => ({
		x: base * (index % cols),
		y: base * Math.floor(index / cols)
	})

	new jimp(base*cols, base * Math.ceil(images / cols), (err, result) => {  
		Promise.all(Array.from({length: images}, (x,i) => i)
			.map(n => `src/assets/buildings/colony_building_${pad(n+1, 4, 0)}.png`)
			.map(filename => jimp.read(filename)))
			.then(images => {
				images
					.reduce((all, image, index) => result.composite(image, position(index).x, position(index).y), result)
					.write('dist/images/colony-screen/buildings.png')
			})
			.then(() => resolve())
			.catch(console.log)
	})
})

gulp.task('templates', () => {
    const templatesDir = 'src/templates/**/*'; // Adjust the glob pattern as needed
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

gulp.task('build', gulp.series(gulp.parallel(['templates', 'sass', 'static', 'assets'])))

gulp.task('watch', () => {
	gulp.watch('src/sass/**/*.scss', gulp.series('sass'))
	gulp.watch('src/static/**/*', gulp.series('static'))
	gulp.watch('src/assets/**/*', gulp.series('assets'))
	gulp.watch('src/templates/**/*', gulp.series('templates'))
})

gulp.task('default', gulp.series('build', 'serve', 'watch'))
