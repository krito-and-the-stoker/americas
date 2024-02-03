<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style lang="scss">
/* Base styles */
body {
    background-color: #121212; /* Dark background */
    color: #E0E0E0; /* Light text color for contrast */
    font-family: sans-serif; /* Widely available sans-serif font */
    font-size: 18px;
    font-weight: 300;
}

/* Headings */
h1, h2, h3, h4, h5, h6 {
    color: #FFFFFF; /* Slightly brighter text for headings */
    margin-top: 0.5em;
    margin-bottom: 0.5em;

    a, a:visited, a:hover {
      color: #FFFFFF;
    }
}

code {
    background-color: #191919;
    padding: 3px;
}

pre {
    background-color: #191919;
    padding: 10px;
}

/* Paragraphs */
p {
    line-height: 1.6; /* Improves readability */
}

/* Lists */
ul, ol {
    margin-left: 20px; /* Indentation for lists */
    padding-left: 0;
}

li {
}

/* Links */
a, a:visited {
    color: #51b0d5; /* A light purple color for links */
    text-decoration: none; /* No underline for a cleaner look */
}

a:hover {
    text-decoration: underline; /* Underline on hover for clarity */
}

/* Bold and Italic Text */
strong, b {
    font-weight: bold;
}

em, i {
    font-style: italic;
}

/* Additional elements like tables, forms, etc. can be added as needed */

</style>