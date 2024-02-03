<script setup>
const { navigation } = useContent()
</script>

<template>
	<div>
		<ul>
			<NavigationNode :node="item" v-for="item in navigation" />
		</ul>
  </div>
  <NuxtPage />
</template>