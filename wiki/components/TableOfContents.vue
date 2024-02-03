<script setup>
const props = defineProps({
	toc: {
		type: Object,
		required: true,
	}
});
</script>

<template>
	<div v-if="toc.links && toc.links.length > 0">
		<b>Table of Contents</b>
		<ul>
			<li v-for="(link, index) in toc.links">
				{{ index + 1}} {{ link.text }}
				<ul v-if="link.children">
					<li v-for="(nested, subindex) in link.children">
						{{ index + 1 }}.{{ subindex + 1 }} {{ nested.text }}
					</li>
				</ul>
			</li>
		</ul>
	</div>
</template>