<script setup>
const { navigation } = useContent()
</script>

<template>
  <div class="container">
  	<div class="navigation">
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
}

.content {
  padding: 20px;
  width: 70vw;
  margin: 0 auto;
  max-width: 1000px;
}

</style>