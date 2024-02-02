const gulp = require('gulp')
const pug = require('gulp-pug')
const sass = require('gulp-sass')(require('sass'))
const browserSync = require('browser-sync').create()
const webpack = require('webpack')
const path = require('path')
const jimp = require('jimp')
const fs = require('fs')
const config = require('./webpack.config.js')

gulp.task('version', done => {
    const versionFilePath = path.resolve(__dirname, '../src/version/version.json');

    // Read the existing version.json file
    let versionData;
    try {
        versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    } catch (err) {
        console.error(`Error reading version file: ${err.message}`);
        done(err);
        return;
    }

    // Update the date in the version data
    versionData.date = new Date().toUTCString();

    // Write the updated data back to the version.json file
    try {
        fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));
    } catch (err) {
        console.error(`Error writing version file: ${err.message}`);
        done(err);
        return;
    }

    done();
});

gulp.task('compile', () => {
	return new Promise(resolve => webpack(config, (err, stats) => {
		if (err) {
			console.log('Webpack', err)     
		}

		console.log(stats.toString({ /* stats options */ }))
		resolve()
	}))
})

gulp.task('js', gulp.series('version', 'compile'))

function swallowError (error) {
	console.log(error.toString())
	this.emit('end')
}


gulp.task('static', () => {
	return gulp.src('src/static/**/*')
		.pipe(gulp.dest('dist'))
})

gulp.task('pug', () => {
	return gulp.src('src/pages/**/*.pug')
		.pipe(pug()).on('error', swallowError)
		.pipe(gulp.dest('dist'))
		.pipe(browserSync.reload({
			stream: true
		}))
})

gulp.task('sass', () => {
	return gulp.src('src/sass/**/*.scss')
		.pipe(sass()).on('error', swallowError)
		.pipe(gulp.dest('dist'))
		.pipe(browserSync.stream())
})

gulp.task('serve', done => {
    browserSync.init({
        server: {
            baseDir: 'dist',
            middleware: function (req, res, next) {
                if (req.url.startsWith("/api")) {
                    try {
	                    // Proxy options
	                    const options = {
	                        target: 'http://event-tracker:8080', // Replace with the target host of your /event route
	                        changeOrigin: true
	                    }

	                    // Create a proxy
	                    const proxy = require('http-proxy').createProxyServer(options)
	                    
	                    // Proxy the request
	                    proxy.web(req, res)
                    } catch(e) {
                    	console.log(e)
                    	next()
                    }
                } else {
                    next()
                }
            }
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

gulp.task('build', gulp.series(gulp.parallel(['pug', 'js', 'sass', 'static', 'assets'])))

gulp.task('watch', () => {
	gulp.watch('src/pages/**/*.pug', gulp.series('pug'))
	gulp.watch('src/js/**/*.js', gulp.series('js'))
	gulp.watch('src/js/**/*.json', gulp.series('js'))
	gulp.watch('src/content/**/*.md', gulp.series('pug'))
	gulp.watch('src/sass/**/*.scss', gulp.series('sass'))
	gulp.watch('src/static/**/*', gulp.series('static'))
	gulp.watch('src/assets/**/*', gulp.series('assets'))
})

gulp.task('default', gulp.series('build', 'serve', 'watch'))
