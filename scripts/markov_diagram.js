let stateData = {
	states: [{}],
	probabilities: [[]],
	edgeColors: [[]],
	initProbs: [],
}
let intervalID = null;

function getRandomColor() {
	let colors = [
		'#4285F4',  // Google Blue
		'#34A853',  // Google Green
		'#F4B400',  // Google Yellow
		'#FFFF00',  // Pure Yellow
		'#0000FF',  // Pure Blue
		'#008080',  // Teal
		'#5d5daf',  // Navy
		'#0096b1',  // Purple
		'#A52A2A',  // Brown
		'#808080'   // Gray
	];
	return colors[Math.floor(Math.random() * colors.length)];
}

function weightedRandomChoice(probabilities) {
	const randomValue = Math.random();
	let sum = 0;
	for (let i = 0; i < probabilities.length; i++) {
		sum += probabilities[i];
		if (randomValue < sum) {
			return i;
		}
	}

	return null; // This should never happen if probabilities sum to 1
}

function createNetwork(states, probabilities, initProbs) {
	// 'states' is an array of names
	// 'probabilities' is a 2D array representing the transition matrix

	// create nodes array
	let nodes = new vis.DataSet();
	for (let i = 0; i < states.length; i++) {
		let randomColor = getRandomColor();
		nodes.add({
			id: i,
			label: states[i],
			color: randomColor,
		});
		//Store in stateData
		stateData.states[i] = {
			id: i,
			name: states[i],
			color: randomColor
		}
	}
	// Create edges array
	let edges = new vis.DataSet();
	let seperation = 0;
	for (let i = 0; i < states.length; i++) {
		for (let j = 0; j < states.length; j++) {
			let prob = probabilities[i][j];
			let color = stateData.states[i].color;
			if (prob > 0) { // If probability is greater than 0, add an edge
				edges.add({
					id: i + j + seperation,
					from: i,
					to: j,
					arrows: 'to',
					arrowStrikethrough: false,
					label: String(prob),
					color: color
				});
			}
			//Store in stateData
			if (!Array.isArray(stateData.probabilities[i])) {
				stateData.probabilities[i] = [];
				stateData.edgeColors[i] = [];
			}

			// Now assign the probability
			stateData.probabilities[i][j] = prob;
			stateData.edgeColors[i][j] = color;
		}
		seperation += states.length;
	}
	// Store initProbs
	stateData.initProbs = initProbs;

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
			font: {
				size: 30,
				face: 'Poppins'
			},
			scaling: {
				min: 10,
				max: 30,
				label: {
					enabled: true,
					min: 14,
					max: 30,
					maxVisible: 30,
					drawThreshold: 5
				},
				customScalingFunction: function (min,max,total,value) {
					if (max === min) {
						return 0.5;
					}
					else {
						let scale = 1 / (max - min);
						return Math.max(0,(value - min)*scale);
					}
				}
			},
		},
		interaction: {
			dragNodes: true,  // Allow dragging nodes
			selectable: false,
			zoomView: true,
			dragView: true,
			hover: true
		},
		physics: {
			stabilization: false,
			barnesHut: {
				gravitationalConstant: -2000,
				springConstant: 0.04,
				springLength: 450,
				avoidOverlap: 0.5,
				damping: 0.9
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
				size: 16,
				face: 'Poppins',
				align: 'top'
			},
			width: 4
		},
		layout: {
			improvedLayout: true,
		},
	};
	
	return new vis.Network(container, data, options);
}

function runSimulation (vis_network, speed, n_steps) {
	// Get the edges and nodes
	let nodes = vis_network.body.data.nodes;
	let edges = vis_network.body.data.edges;
	

	// Get the initial state
	let currentState = weightedRandomChoice(stateData.initProbs);
	let timelineCounter = 0;
	//Show the initial state in timeline
	
	//Set a timeout to highlight the initial state
	appendStateHistory(stateData.states[currentState].name, null, timelineCounter++);

	(function () {
		const promise = new Promise((resolve) => {
			setTimeout(() => {
				nodes.update({ id: currentState, color: 'red', borderWidth: 7 });
				resolve("Node highlighted.");
			}, speed);
		});
		promise
			.then((result) => {
				const nextState = weightedRandomChoice(stateData.probabilities[currentState]);
				showTransition(currentState, nextState, timelineCounter++);
				// Return a new Promise inside then
				return new Promise((resolve) => {
					setTimeout(() => {
						resolve("Transition shown.");
					}, speed);
				});
			})
			.then((result) => {
				console.log(result);
				// Return a new Promise inside then
			});
	})();
	
	function showTransition(fromState, toState, timeLineCount) {
		// Keep the original colors
		const originalNodeColor = stateData.states[fromState].color;
		const originalEdgeColor = stateData.edgeColors[fromState][toState];
		const edgeID = fromState + toState + (fromState * stateData.states.length);

		// Highlight the current state
		nodes.update({ id: fromState, color: 'red', borderWidth: 7, border: originalNodeColor });

		// Highlight the transition edge
		edges.update({ id: edgeID, color: 'red', width: 7 });

		// Highlight the next state
		nodes.update({ id: toState, borderWidth: 7 });
		appendStateHistory(stateData.states[fromState].name, stateData.states[toState].name, timeLineCount);

		// After the speed interval, revert the colors and move to the next state
		setTimeout(() => {
			// Revert colors
			nodes.update({ id: fromState, color: originalNodeColor, borderWidth: 2, border: originalNodeColor });
			edges.update({ id: edgeID, color: originalEdgeColor, width: 4 });

			// Move to the next state
			currentState = toState;
			nodes.update({ id: toState, borderWidth: 7 });
		}, speed);
	}

	// Simulate transitions with a speed*2 interval
	let numRuns = 0;
	intervalID = setInterval(() => {
		const prevState = currentState;
		currentState = weightedRandomChoice(stateData.probabilities[currentState]);
		showTransition(prevState, currentState, timelineCounter++);
		//Create another timeout to wait for the transition to finish
		if (++numRuns >= n_steps - 1) {
			clearInterval(intervalID);
			intervalID = null;
			setTimeout(() => { // Wrap the color reset code in a setTimeout
				resetSimulation(vis_network);
			}, speed * 2);
		}
	}, speed * 2);
}
function appendStateHistory(fromStateName, toStateName, timeLineCount) {
	// Create a new div to hold the transition
	let transitionDiv = $('<div>').addClass('transition-item bg-light p-2 mb-2 border rounded');

	// Create a span for the from state and to state
	let fromSpan = $('<span>').addClass('text-primary').text(fromStateName);
	let toSpan = $('<span>').addClass('text-success').text(toStateName);
	//If first transition, show initial
	if (timeLineCount === 0) {
		transitionDiv.append(`[Initial] `,fromSpan);
		timeLineCount++;
	}
	else{
		// Combine them with an arrow and append to the transitionDiv
		transitionDiv.append(`[${timeLineCount}] `,fromSpan, ' → ', toSpan)
	}
	
	// Append the transitionDiv to the state-history container
	$('#state-history').append(transitionDiv);

	// scroll to bottom
	$('#state-history').scrollTop($('#state-history')[0].scrollHeight);
}
function isRunning() {
	return intervalID !== null;
}
function stopSimulation() {
	clearInterval(intervalID);
	intervalID = null;
}
function clearData() {
	stateData = {
		states: [{}],
		probabilities: [[]],
		edgeColors: [[]],
		initProbs: [],
	};
}
function resetSimulation(vis_network) {
	// Get the edges and nodes
	let nodes = vis_network.body.data.nodes;
	let edges = vis_network.body.data.edges;
	
	// Reset the colors
	let simulateBtn = $("#simulate-btn");
	simulateBtn.text("Simulate").removeClass("btn-danger").addClass("btn-primary");
	for (let i = 0; i < stateData.states.length; i++) {
		nodes.update({ id: i, color: stateData.states[i].color, borderWidth: 2 });
		for (let j = 0; j < stateData.states.length; j++) {
			edges.update({ id: i + j + (i * stateData.states.length), color: stateData.edgeColors[i][j] });
		}
	}
	
}

