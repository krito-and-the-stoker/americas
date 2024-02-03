<script setup>
const { navigation } = useContent()
</script>

<template>
  <div class="container">
  	<div class="navigation">
      <h2>Americas Wiki</h2>
      <nuxt-link to="/">Home</nuxt-link>
  		<ul>
  			<NavigationNode :node="item" v-for="item in navigation" />
  		</ul>
    </div>
    <div class=content>
      <NuxtPage />
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
}

.navigation {
  padding: 10px;
  width: 15vw;
  min-width: 200px;

  ul {
    margin-left: 0;
  }
}

.content {
  padding: 20px;
  width: 70vw;
  margin: 0 auto;
  max-width: 1000px;
}

</style>