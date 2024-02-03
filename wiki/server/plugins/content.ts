export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:beforeParse', (file) => {
    if (file._id.endsWith('.md')) {
      file.body = file.body.replace(/\n/g, '  \n')
      file.body = file.body.replace(/\[\[([^\]]+)\]\]/g, (match, inner) => `:InternalLink{title="${inner}"}`)
    }
  })

  nitroApp.hooks.hook('content:file:afterParse', (file) => {
    // console.log(file)
  })
})
