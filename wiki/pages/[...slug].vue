<script setup lang="ts">
const { page, toc } = useContent();
</script>

<template>
  <h1>{{ page.title }}</h1>
  <TableOfContents :toc="toc" />
  <ContentRenderer :key="page._id" :value="page" />
</template>
