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
const fs = require('fs')
// const SentryCliPlugin = require('@sentry/webpack-plugin')


md.use(mila, {
  attrs: {
    target: '_blank',
    rel: 'noopener'
  }
})


const config = () => {
  const plugins = []
  if (yargs.argv.production) {
    plugins.push(new webpack.EnvironmentPlugin(['KEEN_SECRET', 'ENABLE_TRACKING', 'SENTRY_DSN']))
  }
  //   plugins.push(new SentryCliPlugin({
  //     dryRun: false,
  //     release: require(path.resolve(__dirname, '../src/version/version.json')).revision,
  //     include: path.resolve(__dirname, '../src/js'),
  //     configFile: path.resolve(__dirname, './sentry.properties'),
  //     ignore: ['node_modules', 'webpack.config.js', 'sentry.properties'],
  //   }))
  // }

  const directories = ['action', 'command', 'data', 'entity', 'input', 'render', 'task', 'timeline', 'util', 'view']
  const aliases = directories.map(dir => ({
    [dir]: path.resolve(__dirname, `../src/js/${dir}`)
  })).reduce((all, one) => ({ ...all, ...one }), {})

  return {
    mode: (yargs.argv.production || yargs.argv.staging) ? 'production' : 'development',
    entry: {
      index: './entries/index.js',
      worker: './entries/worker.js'
    },
    output: {
      filename: './[name].entry.js',
      path: path.resolve(__dirname, '../dist')
    },
    resolve: {
      alias: {
        version: path.resolve(__dirname, '../src/version'),
        ...aliases
      }
    },
    devtool: (yargs.argv.production || yargs.argv.staging) ? 'eval' : 'source-map',
    context: path.resolve(__dirname, '../src/js/'),
    plugins: plugins
  }
}

gulp.task('version', done => {
  const revision = require('child_process')
    .execSync('git rev-parse HEAD')
    .toString().trim()
  fs.writeFileSync(path.resolve(__dirname, '../src/version/version.json'), JSON.stringify({
    revision,
    date: new Date().toLocaleString()
  }))
  done()
})

gulp.task('compile', () => {
  return new Promise(resolve => webpack(config(), (err, stats) => {
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
  const images = 139
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

gulp.task('build', gulp.parallel(['pug', 'js', 'sass', 'static', 'assets']))

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
