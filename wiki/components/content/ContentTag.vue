<script setup>
const props = defineProps({
	tag: {
		type: String,
		required: true,
	},
});

</script>

<template>
	<nuxt-link :to="`/tags/${props.tag}`">#{{ props.tag }}</nuxt-link>
</template>