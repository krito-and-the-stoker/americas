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

// h3...h6
const heading = computed(() => props.level <= 3 ? `h${props.level + 3}`: 'h6')
</script>

<template>
	<li>
		<div v-if="props.node.children">
			<component :is="heading">{{ props.node.title }}</component>
			<ul>
				<NavigationNode :node="child" v-for="child in props.node.children" :level="props.level + 1" />
			</ul>
		</div>
		<nuxt-link :href="props.node._path" v-else>{{ props.node.title }}</nuxt-link>
	</li>
</template>