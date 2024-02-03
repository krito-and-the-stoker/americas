<script setup>
import { useRoute } from 'vue-router';
definePageMeta({
  documentDriven: {
  	page: false
  }
});

const { navigation } = useContent();
const route = useRoute();

const findLinks = (list, tag) => {
	const links = list.filter((item) => {
		return item.tags?.includes(tag);
	});

	list.forEach((item) => {
		if (item.children) {
			links.push(...findLinks(item.children, tag));
		}
	});

	return links;
}

const links = findLinks(navigation.value, route.params.tag);
</script>

<template>
	<div>
		<h1>#{{ $route.params.tag }}</h1>
		<ul>
			<li v-for="link in links">
				<nuxt-link :to="link._path">{{ link.title }}</nuxt-link>
			</li>
		</ul>
	</div>	
</template>