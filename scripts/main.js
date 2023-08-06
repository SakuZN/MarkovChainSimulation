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
	let states = ["Sunny", "Rainy", "Cloudy"];
	let probabilities = [
		[0.7, 0.2, 0.1],
		[0.1, 0.6, 0.3],
		[0.2, 0.5, 0.3],
	];
	let initProbs = [0.5, 0.3, 0.2];
	let n_steps = 10;
	let interval = 500;
	return {
		states: states,
		probabilities: probabilities,
		initProbs: initProbs,
		n_steps: n_steps,
		interval: interval
	}
}

function sampleHealth(){
	let states = ["Healthy", "Sick", "Recovering"];
	let probabilities = [
		[0.6, 0.4, 0],
		[0,0.5,0.5],
		[0.5,0.25,0.25]
	];
	let initProbs = [0.6, 0.2, 0.2];
	let n_steps = 10;
	let interval = 500;
	return {
		states: states,
		probabilities: probabilities,
		initProbs: initProbs,
		n_steps: n_steps,
		interval: interval
	}
}

function sampleManufacturing(){
	let states = ["Defective", "Working", "Repaired"];
	let probabilities = [
		[0.4, 0.2, 0.4],
		[0.4, 0.6, 0],
		[0.2, 0.6, 0.2]
	];
	let initProbs = [0.3, 0.4, 0.3];
	let n_steps = 10;
	let interval = 500;
	return {
		states: states,
		probabilities: probabilities,
		initProbs: initProbs,
		n_steps: n_steps,
		interval: interval
	}
}
function sampleSports(){
	let states = ["Play Well", "Play Poor", "Injured"];
	let probabilities = [
		[0.5,0.2,0.3],
		[0.2,0.2,0.6],
		[0,1,0]
	];
	let initProbs = [0.33, 0.33, 0.34];
	let n_steps = 10;
	let interval = 500;
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
	const n_matrixInputs = $("#nmatrix-inputs");
	const n_steps = $("#n-steps-input");
	const interval = $("#interval-input");
	const n_value = $("#n-value-input");

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
	function getNValue() {
		return parseInt(n_value.val());
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
		n_matrixInputs.empty();

		// Create matrix header
		let header = $("<div>").addClass("row mb-2");
		header.append($("<div>").addClass("col")); // Empty space for the top left cell
		for (let i = 0; i < stateNames.length; i++) {
			header.append($("<div>").addClass("col").text(stateNames[i]));
		}
		matrixInputs.append(header);
		n_matrixInputs.append(header.clone());

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
			n_matrixInputs.append(row.clone());
			//Disable the inputs for n matrix
			n_matrixInputs.find("input").prop("disabled", true);
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
			.attr("maxlength", "10")
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
		initProbInputs.find("input").last().remove();
		matrixInputs.find(".row").each(function() {
			$(this).find(".col").last().remove();
		})
		matrixInputs.find(".row").last().remove();
		n_matrixInputs.find(".row").each(function() {
			$(this).find(".col").last().remove();
		})
		n_matrixInputs.find(".row").last().remove();
		updateProbInputs();
	}
	function destroyNetwork() {
		if (event) {
			event.preventDefault();
		}
		if(visNetwork != null) {
			visNetwork.destroy();
			visNetwork = null;
		}
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
		n_matrixInputs.empty();
		$("#state-history").empty();
		destroyNetwork();
		
	}
	function initForm(){
		while(stateInputs.find("input").length < 2){
			addNewState();
		}
	}
	
	//Helper function for matrix exponentiation
	function multiplyMatrix(A, B) {
		let rowsA = A.length, colsA = A[0].length,
			rowsB = B.length, colsB = B[0].length,
			C = [];

		if (colsA != rowsB) return false;

		for (let i = 0; i < rowsA; i++) C[i] = [];

		for (let k = 0; k < colsA; k++) {
			for (let i = 0; i < rowsA; i++) {
				if (!C[i][k]) C[i][k] = 0;
				for (let j = 0; j < colsB; j++) {
					if (!B[k][j]) B[k][j] = 0;
					if (!C[i][j]) C[i][j] = 0;
					C[i][j] += A[i][k] * B[k][j];
				}
			}
		}

		return C;
	}

	function matrixExponentiation(matrix, power) {
		let identityMatrix = matrix.map((row, rowIndex) =>
			row.map((val, colIndex) => +(rowIndex === colIndex))
		);

		while (power > 0) {
			if (power & 1) {
				identityMatrix = multiplyMatrix(identityMatrix, matrix);
			}
			matrix = multiplyMatrix(matrix, matrix);
			power >>= 1;
		}

		return identityMatrix;
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
			return;
		}

		destroyNetwork();
		visNetwork = createNetwork(getStateNames(), getMatrix(), getInitProbs());
		
		visNetwork.on('stabilizationIterationsDone', function () {
			// Disable physics once the network has stabilized
			visNetwork.setOptions({ physics: false });
			visNetwork.fit();
		});
	}

	function runMarkovChain() {
		if (event) {
			event.preventDefault();
		}
		//Check if the diagram is initialized
		if (!visNetwork) {
			showPopup("Please initialize the diagram first.");
			return;
		}
		let simulateBtn = $("#simulate-btn");
		resetSimulation(visNetwork);
		//Check if the simulation is running if yes, call stopSimulation and revert the button text
		if (isRunning()) {
			stopSimulation();
			resetSimulation(visNetwork);
			simulateBtn.text("Simulate").removeClass("btn-danger").addClass("btn-primary");
			return;
		}
		$("#state-history").empty();
		runSimulation(visNetwork, getInterval(), getNSteps());
		//Change the button text to stop and change bootstrap class
		simulateBtn.text("Stop").removeClass("btn-primary").addClass("btn-danger");

	}
	function preFillForm(){
		//Get the id of the button
		let id = $(this).attr("id");
		//depending on the data, let data be a function that returns the data
		let data = null;
		switch (id) {
			case "weather-data":
				data = sampleWeather();
				break;
			case "health-data":
				data = sampleHealth();
				break;
			case "manufacture-data":
				data = sampleManufacturing();
				break;
			case "sports-data":
				data = sampleSports();
				break;
			default:
				console.log("Error: Invalid button id");
				return;
		}
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
		n_matrixInputs.append(header.clone());
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
			n_matrixInputs.append(row.clone());
			//Disable the inputs for n matrix
			n_matrixInputs.find("input").prop("disabled", true);
		}
		n_steps.val(data.n_steps);
		interval.val(data.interval);
		//Initialize the diagram
		initStateDiagram();
	}
	function n_stepCalculation(){
		let matrixToPower = getMatrix();
		let newMatrix = matrixExponentiation(matrixToPower, getNValue());
		//For every row, replace the value of input per column
		for (let i = 0; i < newMatrix.length; i++) {
			for (let j = 0; j < newMatrix.length; j++) {
				n_matrixInputs.find("input").eq(i * newMatrix.length + j).val(newMatrix[i][j]);
			}
		}
	}

	$("#add-state").on("click", addNewState);
	$("#delete-state").on("click", deleteState);
	$("#reset-btn").on("click", resetForm);
	$("#display-btn").on("click", initStateDiagram);
	$("#simulate-btn").on("click", runMarkovChain);
	$("#weather-data").on("click", preFillForm);
	$("#health-data").on("click", preFillForm);
	$("#manufacture-data").on("click", preFillForm);
	$("#sports-data").on("click", preFillForm);
	n_value.on("input blur", n_stepCalculation);

	initForm();
});