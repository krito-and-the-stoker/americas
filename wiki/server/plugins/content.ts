export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:beforeParse', (file) => {
    if (file._id.endsWith('.md')) {
      file.body = file.body.replace(/\n/g, '  \n')
    }
  })

  nitroApp.hooks.hook('content:file:afterParse', (file) => {
    // console.log(file)
  })
})
