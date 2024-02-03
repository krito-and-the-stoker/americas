<script setup>
const props = defineProps({
	title: {
		type: String,
		required: true,
	},
});

const { navigation } = useContent();
const findPath = (node, title) => {
	if (node.title?.toLowerCase() === title?.toLowerCase()) {
		return node._path;
	}

	if (node.children) {
		for (const child of node.children) {
			const path = findPath(child, title);
			if (path) {
				return path;
			}
		}
	}
};

const path = computed(() => {
	return findPath({ children: navigation.value }, props.title);
});
</script>

<template>
	<nuxt-link :to="path">{{ props.title }}</nuxt-link>
</template>