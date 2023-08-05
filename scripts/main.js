let visNetwork = null;
function showPopup(message) {
	return new Promise((resolve) => {
		let dialog = document.querySelector("#dialog");
		dialog.querySelector(".modal-body p").textContent = message;

		// Create a new Bootstrap Modal instance
		let bsModal = new bootstrap.Modal(dialog);

		// Show the modal
		bsModal.show();

		// Listen to the 'hidden.bs.modal' event
		dialog.addEventListener('hidden.bs.modal', function () {
			resolve();
			// You can remove the event listener once it has been triggered
			this.removeEventListener('hidden.bs.modal', arguments.callee);
		});
	});
}
function sampleWeather(){
	let states = ["Sunny", "Rainy"];
	let probabilities = [
		[0.5, 0.5],
		[0.5, 0.5]
	];
	let initProbs = [0.5, 0.5];
	let n_steps = 10;
	let interval = 1000;
	return {
		states: states,
		probabilities: probabilities,
		initProbs: initProbs,
		n_steps: n_steps,
		interval: interval
	}
}

$(document).ready(function() {
	const stateInputs = $("#state-inputs");
	const initProbInputs = $("#init-prob-inputs");
	const matrixInputs = $("#matrix-inputs");
	const n_steps = $("#n-steps-input");
	const interval = $("#interval-input");

	function getStateNames() {
		return stateInputs.find("input").map(function() {
			return $(this).val();
		}).get();
	}
	function getMatrix() {
		let matrix = matrixInputs.find('input').map(function () {
			return parseFloat($(this).val());
		}).get();
		//Transform into a 2D array
		let matrix2D = [];
		for (let i = 0; i < matrix.length; i += getStateNames().length) {
			matrix2D.push(matrix.slice(i, i + getStateNames().length));
		}
		return matrix2D;
	}
	function getInitProbs() {
		return initProbInputs.find('input').map(function () {
			return parseFloat($(this).val());
		}).get();
	}
	function getNSteps() {
		return parseInt(n_steps.val());
	}
	function getInterval() {
		return parseInt(interval.val());
	}

	function updateProbInputs() {
		let stateNames = getStateNames();

		// Store current data
		let currentData = [];
		initProbInputs.find('input').each(function(index) {
			currentData[index] = { initProb: $(this).val(), transitionProbs: [] };
		});
		matrixInputs.find('input').each(function(index) {
			let row = Math.floor(index / stateNames.length);
			currentData[row].transitionProbs.push($(this).val());
		});

		initProbInputs.empty();
		matrixInputs.empty();

		// Create matrix header
		let header = $("<div>").addClass("row mb-2");
		header.append($("<div>").addClass("col")); // Empty space for the top left cell
		for (let i = 0; i < stateNames.length; i++) {
			header.append($("<div>").addClass("col").text(stateNames[i]));
		}
		matrixInputs.append(header);

		for (let i = 0; i < stateNames.length; i++) {
			// Create initial state probability inputs
			let initStateInput = $("<input>")
				.attr("type", "text")
				.addClass("form-control mb-2")
				.attr("placeholder", "Probability for " + stateNames[i]);
			if (currentData[i]) {
				initStateInput.val(currentData[i].initProb);
			}
			initProbInputs.append(initStateInput);

			// Create a row for the transition matrix
			let row = $("<div>").addClass("row");
			row.append($("<div>").addClass("col").text(stateNames[i]));
			for (let j = 0; j < stateNames.length; j++) {
				let placeholder = "Probability from " + stateNames[i] + " to " + stateNames[j];
				let matrixInput = $("<input>")
					.attr("type", "text")
					.addClass("form-control mb-2")
					.attr("placeholder", placeholder);
				if (currentData[i] && currentData[i].transitionProbs[j]) {
					matrixInput.val(currentData[i].transitionProbs[j]);
				}
				let column = $("<div>").addClass("col").append(matrixInput);
				row.append(column);
			}
			matrixInputs.append(row);
		}
	}

	function addNewState() {
		if (event) {
			event.preventDefault();
		}
		// Add a new state input
		let newStateInput = $("<input>")
			.attr("type", "text")
			.addClass("form-control mb-2")
			.attr("placeholder", "Enter state")
			//add character limit
			.attr("maxlength", "8")
			.keyup(updateProbInputs);  // Add keyup event listener
		stateInputs.append(newStateInput);

		// Update the probability inputs
		updateProbInputs();
	}
	function deleteState() {
		if (event) {
			event.preventDefault();
		}
		// Remove the state input
		//Remove the last or latest state input
		stateInputs.find("input").last().remove();
		updateProbInputs();
	}
	function resetForm(){
		if (event) {
			event.preventDefault();
		}
		//From the button, find the parent form and reset it
		$(this).parents("form").trigger("reset");
		//Remove all the state inputs
		stateInputs.empty();
		//Remove all the initial probability inputs
		initProbInputs.empty();
		//Remove all the transition matrix inputs
		matrixInputs.empty();
		if (visNetwork !== null) {
			visNetwork.destroy();
		}
	}
	function initForm(){
		while(stateInputs.find("input").length < 2){
			addNewState();
		}
	}

	//Helper function for input validation
	function stateValidation(){
		/*
			Verify input rules
			1. State names must be unique
			2. State names must not be empty
			3. Probabilities must be between 0 and 1
			4. Probabilities must sum to 1
		*/
		let stateNames = getStateNames();
		let probabilities = getMatrix();
		let initProbs = getInitProbs();

		// Verify that state names are unique and not empty
		let nameSet = new Set(stateNames);
		if (stateNames.some(name => name.trim() === "")) {
			return "State names must not be empty."
		}
		if (nameSet.size !== stateNames.length) {
			return "State names must be unique."
		}
		// Define a small tolerance for floating point comparison
		const epsilon = 0.00001;

		// Verify that probabilities are between 0 and 1, and sum to 1
		for (let row of probabilities) {
			let rowSum = row.reduce((a, b) => a + b, 0);
			console.log(rowSum);
			console.log(Math.abs(rowSum - 1));
			if (Math.abs(rowSum - 1) > epsilon) {  // Allow for small floating point errors
				return "Each row of probabilities must sum to 1."
			}
			if (row.some(prob => prob < 0 || prob > 1)) {
				return "Probabilities must be between 0 and 1."
			}
		}

		// Verify that initial probabilities are between 0 and 1, and sum to 1
		let initSum = initProbs.reduce((a, b) => a + b, 0);

		if (Math.abs(initSum - 1) > epsilon) {
			return "Initial probabilities must sum to 1."
		}
		if (initProbs.some(prob => prob < 0 || prob > 1)) {
			return "Initial probabilities must be between 0 and 1."
		}

		// If all validations passed, return true
		return true;
	}

	function initStateDiagram(){
		if (event) {
			event.preventDefault();
		}
		//Validate the input
		let isValidated = stateValidation();

		if (typeof isValidated === "string"){
			showPopup(isValidated);
			console.log(isValidated);
			return;
		}

		if (visNetwork !== null) {
			visNetwork.destroy();
		}
		visNetwork = createNetwork(getStateNames(), getMatrix(), getInitProbs());

		visNetwork.on('stabilizationIterationsDone', function () {
			// Disable physics once the network has stabilized
			visNetwork.setOptions({ physics: false });
		});
	}

	function runMarkovChain() {
		if (event) {
			event.preventDefault();
		}
		//Check if the diagram is initialized
		if (visNetwork === null) {
			showPopup("Please initialize Markov Chain first.");
			return;
		}
		//Check if the simulation is running if yes, call stopSimulation and revert the button text
		if (isRunning()) {
			stopSimulation();
			$("#simulate-btn").text("Simulate").removeClass("btn-danger").addClass("btn-primary");
			return;
		}
		runSimulation(visNetwork, getInterval(), getNSteps());
		//Change the button text to stop and change bootstrap class
		$("#simulate-btn").text("Stop").removeClass("btn-primary").addClass("btn-danger");

	}
	function preFillForm(){
		let data = sampleWeather();
		if (event) {
			event.preventDefault();
		}
		resetForm();
		//Fill the form
		//Loop through states data and prefilled the state inputs
		for (let state of data.states) {
			let newStateInput = $("<input>")
				.attr("type", "text")
				.addClass("form-control mb-2")
				.attr("placeholder", "Enter state")
				//add character limit
				.attr("maxlength", "10")
				.keyup(updateProbInputs);  // Add keyup event listener
			stateInputs.append(newStateInput);
			newStateInput.val(state);
		}
		// Create matrix header
		let header = $("<div>").addClass("row mb-2");
		header.append($("<div>").addClass("col")); // Empty space for the top left cell
		for (let i = 0; i < data.states.length; i++) {
			header.append($("<div>").addClass("col").text(data.states[i]));
		}
		matrixInputs.append(header);

		for (let i = 0; i < data.states.length; i++) {
			// Create initial state probability inputs
			let initStateInput = $("<input>")
				.attr("type", "text")
				.addClass("form-control mb-2")
				.attr("placeholder", "Probability for " + data.states[i]);
			initStateInput.val(data.initProbs[i]);
			initProbInputs.append(initStateInput);

			// Create a row for the transition matrix
			let row = $("<div>").addClass("row");
			row.append($("<div>").addClass("col").text(data.states[i]));
			for (let j = 0; j < data.states.length; j++) {
				let placeholder = "Probability from " + data.states[i] + " to " + data.states[j];
				let matrixInput = $("<input>")
					.attr("type", "text")
					.addClass("form-control mb-2")
					.attr("placeholder", placeholder);
				matrixInput.val(data.probabilities[i][j]);
				let column = $("<div>").addClass("col").append(matrixInput);
				row.append(column);
			}
			matrixInputs.append(row);
		}
		n_steps.val(data.n_steps);
		interval.val(data.interval);
	}

	$("#add-state").on("click", addNewState);
	$("#delete-state").on("click", deleteState);
	$("#reset-btn").on("click", resetForm);
	$("#display-btn").on("click", initStateDiagram);
	$("#simulate-btn").on("click", runMarkovChain);
	$("#weather-data").on("click", preFillForm);

	initForm();
});