<script setup>
const props = defineProps({
	toc: {
		type: Object,
		required: true,
	}
});
</script>

<template>
	<div v-if="toc.links && toc.links.length > 0" class="contents">
		<b>Table of Contents</b>
		<ul>
			<li v-for="(link, index) in toc.links">
				{{ index + 1}} <a :href="`#${link.id}`">{{ link.text }}</a>
				<ul v-if="link.children">
					<li v-for="(nested, subindex) in link.children">
						{{ index + 1 }}.{{ subindex + 1 }} <a :href="`#${nested.id}`">{{ nested.text }}</a>
					</li>
				</ul>
			</li>
		</ul>
	</div>
</template>

<style scoped lang="scss">
li {
	list-style: none;
	margin: 3px 0;
}

.contents {
	background-color: #191919;
	padding: 20px;
	padding-bottom: 5px;
}
</style>