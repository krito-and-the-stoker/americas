const hasFrontMatter = (file) => file.body.startsWith('---');
const addFrontMatterData = (file, data) => {
  if (hasFrontMatter(file)) {
    file.body = file.body.replace('---', `---\n${data}`);
  } else {
    file.body = `---\n${data}\n---\n${file.body}`;
  }
};

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('content:file:beforeParse', (file) => {
    if (file._id.endsWith('.md')) {
      // Adding 2 spaces to the end of a line makes Markdown respect the line break
      file.body = file.body.replace(/\n/g, '  \n')
      // Replace [[Page Title]] with :ContentLink{title="Page Title"}
      file.body = file.body.replace(/\[\[([^\]]+)\]\]/g, (match, inner) => `:ContentLink{title="${inner}"}`)
      
      // Replace #tag with :ContentTag{title="tag"}
      // also, gather tags and add them to frontmatter
      let tags = [];
      file.body = file.body.replace(/#([^\s#]+)/g, (match, inner) => {
        tags.push(inner);
        return `:ContentTag{tag="${inner}"}`
      })
      addFrontMatterData(file, 'navigation:\n  tags: ' + JSON.stringify(tags));
    }
  });

  nitroApp.hooks.hook('content:file:afterParse', (file) => {
    // console.log(file._id, file.navigation);
  })
})
