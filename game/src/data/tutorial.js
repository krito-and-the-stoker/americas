export default [
	{
		name: 'select', // do not change the name, has to match video source in resources module
		preconditions: [], // when can this event occur
		text: 'Click on your ship to select it',
		wait: {
			initial: 5, // how many seconds we will wait initially
			repeat: 15 // how many seconds we will wait until showing the same message again
		},
		type: 'video'
	}, {
		name: 'move',
		preconditions: ['select'],
		text: 'Right-click somewhere on the map to your left to send your ship there',
		wait: {
			initial: 10,
			repeat: 30
		},
		type: 'video'
	}, {
		name: 'drag',
		preconditions: ['move'],
		text: 'You can change the view by holding and dragging your left mouse button',
		wait: {
			initial: 10,
			repeat: 30
		},
		type: 'video'
	}, {
		name: 'zoom',
		preconditions: ['drag'],
		text: 'You can use your mouse wheel to zoom in and out',
		wait: {
			initial: 10,
			repeat: 30
		},
		type: 'video'
	}, {
		name: 'discovery',
		preconditions: ['zoom'],
		text: 'There are signs of land ahead. We should keep sailing to the west!',
		wait: {
			initial: 15,
			repeat: 30
		},
		type: 'naval'
	}, {
		name: 'landfall',
		preconditions: ['discovery'],
		text: 'Disembark a passanger by targeting land with your ship',
		wait: {
			initial: 15,
			repeat: 30
		},
		type: 'video'
	}, {
		name: 'foundColony',
		preconditions: ['landfall'],
		text: 'You should found a colony by left-clicking on the command or pressing -b-',
		wait: {
			initial: 10,
			repeat: 30
		},
		type: 'video'
	}, {
		name: 'goEurope',
		preconditions: [],
		text: 'You should return to Europe to pick up settlers willing to migrate the new world. Move your ship to the darker water areas to it them across the atlantic. You might also use the go-to command instead',
		wait: {
			initial: 10,
			repeat: 30
		},
		type: 'video'
	}, {
		name: 'colony',
		preconditions: ['foundColony'],
		text: "In your colony you can send settlers to work on the surrounding lands to produce food or raw materials. You can send settlers into colony buildings to produce valuable goods or build up your infrastructure. Ships can be loaded or unlaoded here, too. -Always make sure you got enough food, so your settlers won't starve!",
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'equip',
		preconditions: ['colony'],
		text: 'Drag settlers to the lower right area to make them leave the colony. Settlers can be equipt with tools to create a pioneer, guns to arm a soldier or horses to mount a scout. -Tools, guns, horeses can be bought in Europe.',
		wait: {
			initial: 10,
			repeat: 15
		},
		type: 'video'
	}, {
		name: 'pioneer',
		preconditions: ['foundColony'],
		text: 'You can use your pioneer to clear forest and plow fields to grow more crops. Or build roads on forests and hills to improve production. Any action will consume 20 tools. -Roads allow for faster traveling! ',
		wait: {
			initial: 10,
			repeat: 30
		},
		type: 'video'
	}, {
		name: 'inEurope',
		preconditions: ['goEurope'],
		text: 'Drag a settler waiting at the docks onto your ship to bring him to the new world. Click our your vessel to send it back to the new-world! -You can also buy or sell goods here by dragging them on or off your ship.',
		wait: {
			initial: 10,
			repeat: 30
		},
		type: 'video'
	}
]