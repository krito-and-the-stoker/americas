export default [
	{
		name: 'select', // do not change the name, has to match video source in resources module
		preconditions: [], // when can this event occur
		text: 'Click on your caravel to select it',
		wait: {
			initial: 5, // how many seconds we will wait initially
			repeat: 10 // how many seconds we will wait until showing the same message again
		},
		type: 'video'
	}, {
		name: 'move',
		preconditions: ['select'],
		text: 'Right-click somewhere on the map to the west to go there',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'drag',
		preconditions: ['move'],
		text: 'You can drag wow!',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'zoom',
		preconditions: ['drag'],
		text: 'You can zoom also!',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'discovery',
		preconditions: ['zoom'],
		text: 'Sail to the west, there will be land',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'naval'
	}, {
		name: 'landfall',
		preconditions: ['discovery'],
		text: 'Disembark a passanger by targeting land with your ship',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'foundColony',
		preconditions: ['disembark'],
		text: 'Found a colony',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		// has no type and will not be shown
		name: 'immigration', // Will be marked complete when the first settler is created in europe
	}, {
		name: 'goEurope',
		preconditions: ['immigration'],
		text: 'Go to Europe and get your settler',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}
]