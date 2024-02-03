<script setup>
const props = defineProps({
	node: {
		type: Object,
		required: true
	},
	level: {
		type: Number,
		default: 0
	}
});
</script>

<template>
	<li>
		<div v-if="props.node.children">
			<b>{{ props.node.title }}</b>
			<ul>
				<NavigationNode :node="child" v-for="child in props.node.children" :level="props.level + 1" />
			</ul>
		</div>
		<nuxt-link :href="props.node._path" v-else>{{ props.node.title }}</nuxt-link>
	</li>
</template>