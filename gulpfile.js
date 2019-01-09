const gulp = require('gulp')
const pug = require('gulp-pug')
const sass = require('gulp-sass')
const browserSync = require('browser-sync').create()
const md = require('markdown-it')({ html: true })
const mila = require('markdown-it-link-attributes')
const webpack = require('webpack')
const path = require('path')
const yargs = require('yargs')
const jimp = require('jimp')

md.use(mila, {
  attrs: {
    target: '_blank',
    rel: 'noopener'
  }
})

const config = {
	mode: yargs.argv.production ? 'production' : 'development',
  entry: {
    main: './main.js',
    worker: './worker/main.js'
  },
  output: {
    filename: './[name].entry.js',
    path: path.resolve(__dirname, 'dist')
  },
  context: path.resolve(__dirname, 'src/js/')
}

gulp.task('js', () => {
  return new Promise(resolve => webpack(config, (err, stats) => {
    if (err) {
			console.log('Webpack', err)    	
    } 

    console.log(stats.toString({ /* stats options */ }))
    resolve()
  }))
})

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
		.pipe(pug({
			filters: {
				markdown: (input) => {
					return md.render(input)
				}
			}
		})).on('error', swallowError)
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

gulp.task('serve', () => {
  browserSync.init({
    server: {
      baseDir: 'dist',
    },
    open: false
  })
})

gulp.task('assets', resolve => {
  const cols = 4
  const images = 18
  const rows = 5
  const base = 128
  const pad = (n, width, z) => {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
  const position = (index) => ({
    x: base * (index % cols),
    y: base * Math.floor(index / cols)
  })

  new jimp(base*cols, base*rows, (err, result) => {  
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

gulp.task('build', gulp.parallel(['pug', 'js', 'sass', 'static', 'assets']))

gulp.task('watch', gulp.parallel(['serve']), () => {
	gulp.watch('src/pages/**/*.pug', ['pug'])
  gulp.watch('src/js/**/*.js', ['js'])
	gulp.watch('src/js/**/*.json', ['js'])
	gulp.watch('src/content/**/*.md', ['pug'])
	gulp.watch('src/sass/**/*.scss', ['sass'])
  gulp.watch('src/static/**/*', ['static'])
	gulp.watch('src/assets/**/*', ['assets'])
})

gulp.task('default', gulp.series(['build', 'watch']))
