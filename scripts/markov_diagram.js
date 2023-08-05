
function getRandomColor() {
	let r = Math.floor(Math.random() * 256);
	let g = Math.floor(Math.random() * 256);
	let b = Math.floor(Math.random() * 256);
	return 'rgb(' + r + ',' + g + ',' + b + ')';
}
function randomNumber(min, max) {
	return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

function createNetwork(states, probabilities) {
	// 'states' is an array of names
	// 'probabilities' is a 2D array representing the transition matrix

	// create nodes array
	let nodes = new vis.DataSet(states.map((state, index) => ({
		id: index,
		label: state,
		color: getRandomColor()
	})));

	// Create edges array
	let edges = new vis.DataSet();
	let seperation = 0;
	for (let i = 0; i < states.length; i++) {
		for (let j = 0; j < states.length; j++) {
			let prob = probabilities[i][j];
			if (prob > 0) { // If probability is greater than 0, add an edge
				edges.add({
					from: i,
					to: j,
					arrows: 'to',
					label: String(prob)
				});
			}
		}
		seperation += states.length;
	}

	// create a network
	// create a network
	let container = document.getElementById('canvas');
	let data = {
		nodes: nodes,
		edges: edges
	};

	let options = {
		nodes: {
			shape: 'circle',
			physics: true,
			size: 500,
			font: {
				size: 20,
				face: 'Poppins'
			}
		},
		interaction: {
			dragNodes: true,  // Allow dragging nodes
			selectable: false,
			zoomView: false,
			dragView: false
		},
		physics: {
			solver: 'forceAtlas2Based',
			timestep: 0.5,
			stabilization: {
				enabled: true,
				iterations: 1000,
				updateInterval: 50
			},
			forceAtlas2Based: {
				gravitationalConstant: -150,
				springConstant: 0,
				springLength: 0,
				damping: 0.4,
				avoidOverlap: 0.1,
			}
		},
		edges: {
			smooth: {
				type: 'dynamic',  // Use dynamic smoothing
			},
			arrows: {
				to: {
					enabled: true
				}
			},
			font: {
				size: 20,
				face: 'Poppins',
				align: 'top'
			},
			width: 4
		},
		layout: {
			improvedLayout: true,
		}
	};
	return new vis.Network(container, data, options);
}

