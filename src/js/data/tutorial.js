export default [
	{
		name: 'select', // do not change the name, has to match video source in resources module
		preconditions: [], // when can this event occur
		text: 'Click on your ship to select it',
		wait: {
			initial: 5, // how many seconds we will wait initially
			repeat: 10 // how many seconds we will wait until showing the same message again
		},
		type: 'video'
	}, {
		name: 'move',
		preconditions: ['select'],
		text: 'Right-click somewhere on the map to your left to send your ship there',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'drag',
		preconditions: ['move'],
		text: 'You can drag the view by holding and dragging your left mouse button',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'zoom',
		preconditions: ['drag'],
		text: 'You can use your mouse wheel to zoom in and out',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'discovery',
		preconditions: ['zoom'],
		text: 'There are signs of land ahead. Keep sailing to the west to find new shores!',
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
		text: 'You should found a colony by left-clicking on the command or pressing -b-',
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
		text: 'You should return to Europe to bring a settler to the wen world and maybe buy needed goods',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}
]