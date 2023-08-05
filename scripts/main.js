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

$(document).ready(function() {
	const stateInputs = $("#state-inputs");
	const initProbInputs = $("#init-prob-inputs");
	const matrixInputs = $("#matrix-inputs");

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
			return $(this).val();
		}).get();
	}

	function updateProbInputs() {
		let stateNames = getStateNames();

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
			initProbInputs.append(initStateInput);

			// Create a row for the transition matrix
			let row = $("<div>").addClass("row");
			row.append($("<div>").addClass("col").text(stateNames[i]));
			for (let j = 0; j < stateNames.length; j++) {
				let matrixInput = $("<input>")
					.attr("type", "text")
					.addClass("form-control mb-2")
					.attr("placeholder", "Probability from " + stateNames[i] + " to " + stateNames[j]);
				let column = $("<div>").addClass("col").append(matrixInput);
				row.append(column);
			}
			matrixInputs.append(row);
		}
	}

	function addNewState() {
		event.preventDefault();
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
		event.preventDefault();
		// Remove the state input
		//Remove the last or latest state input
		stateInputs.find("input").last().remove();
		updateProbInputs();
	}
	function resetForm(){
		event.preventDefault();
		//From the button, find the parent form and reset it
		$(this).parents("form").trigger("reset");
		//Remove all the state inputs
		stateInputs.empty();
		//Remove all the initial probability inputs
		initProbInputs.empty();
		//Remove all the transition matrix inputs
		matrixInputs.empty();
		visNetwork.destroy();
		visNetwork = null;
	}
	function initForm(){
		while(stateInputs.find("input").length < 2){
			let newStateInput = $("<input>")
				.attr("type", "text")
				.addClass("form-control mb-2")
				.attr("placeholder", "Enter state")
				.keyup(updateProbInputs);  // Add keyup event listener
			stateInputs.append(newStateInput);
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
		// Verify that probabilities are between 0 and 1, and sum to 1
		for (let row of probabilities) {
			console.log(row);
			let rowSum = row.reduce((a, b) => a + b, 0);
			console.log(rowSum);
			if (Math.abs(rowSum - 1) > 0.001) {  // Allow for small floating point errors
				return "Each row of probabilities must sum to 1."
			}
			if (row.some(prob => prob < 0 || prob > 1)) {
				return "Probabilities must be between 0 and 1."
			}
		}

		// Verify that initial probabilities are between 0 and 1, and sum to 1
		let initSum = initProbs.reduce((a, b) => a + b, 0);
		if (Math.abs(initSum - 1) > 0.001) {
			return "Initial probabilities must sum to 1."
		}
		if (initProbs.some(prob => prob < 0 || prob > 1)) {
			return "Initial probabilities must be between 0 and 1."
		}

		// If all validations passed, return true
		return true;
	}

	function initStateDiagram(){
		event.preventDefault();
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
		visNetwork = createNetwork(getStateNames(), getMatrix());

		visNetwork.on('stabilizationIterationsDone', function () {
			// Disable physics once the network has stabilized
			visNetwork.setOptions({ physics: false });
		});
	}

	$("#add-state").on("click", addNewState);
	$("#delete-state").on("click", deleteState);
	$("#reset-btn").on("click", resetForm);
	$("#display-btn").on("click", initStateDiagram);


	initForm();
});