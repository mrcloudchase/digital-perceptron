document.addEventListener('DOMContentLoaded', function() {
    // Setup UI elements
    const gridCells = document.querySelectorAll('.grid-cell');
    const decisionBulb = document.getElementById('decision-bulb');
    
    // Grid size selector elements
    const gridRowsInput = document.getElementById('grid-rows');
    const gridColsInput = document.getElementById('grid-cols');
    const applyGridSizeBtn = document.getElementById('apply-grid-size');
    
    // Handle tutorial overlay
    const tutorialOverlay = document.getElementById('tutorialOverlay');
    const closeTutorialBtn = document.getElementById('closeTutorial');
    
    // Experiment instructions elements
    const experimentInstructionsButton = document.getElementById('experiment-instructions-button');
    const experimentInstructionsOverlay = document.getElementById('experimentInstructionsOverlay');
    const closeExperimentInstructionsButton = document.getElementById('closeExperimentInstructions');
    
    // Pattern application buttons
    const patternApplyButtons = document.querySelectorAll('.pattern-apply-button');
    
    // Current grid dimensions
    let gridRows = 4;
    let gridCols = 4;
    
    // Auto Training functionality
    const autoTrainingControls = document.getElementById('auto-training-controls');
    const toggleAutoTrainingBtn = document.getElementById('toggle-auto-training-btn');
    const setTargetPatternBtn = document.getElementById('set-target-pattern');
    const startTrainingBtn = document.getElementById('start-training');
    const pauseTrainingBtn = document.getElementById('pause-training');
    const resetTrainingBtn = document.getElementById('reset-training');
    const trainingSpeedSlider = document.getElementById('training-speed');
    const trainingSpeedValue = document.getElementById('training-speed-value');
    const maxIterationsInput = document.getElementById('max-iterations');
    const iterationCounter = document.getElementById('iteration-counter');
    const accuracyMeter = document.getElementById('accuracy-meter');
    const accuracyMeterFill = document.querySelector('#accuracy-meter .meter-fill');
    const accuracyValue = document.querySelector('#accuracy-meter .meter-value');
    const targetPatternDisplay = document.getElementById('target-pattern-display');
    const miniGrid = document.querySelector('.mini-grid');
    
    // Auto training state
    let isAutoTrainModeEnabled = false;
    let isTraining = false;
    let targetPattern = null;
    let trainingPatterns = [];
    let currentTrainingIndex = 0;
    let currentIteration = 0;
    let maxIterations = 100;
    let trainingSpeed = 10; // patterns per second
    let trainingInterval = null;
    let correctClassifications = 0;
    let totalClassifications = 0;
    let accuracy = 0;
    
    // Define all possible horizontal and vertical line patterns for a 4x4 grid
    const HORIZONTAL_PATTERNS = [
        // Row 0 (top)
        [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        // Row 1
        [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        // Row 2
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
        // Row 3 (bottom)
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]
    ];

    const VERTICAL_PATTERNS = [
        // Column 0 (left)
        [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
        // Column 1
        [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
        // Column 2
        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        // Column 3 (right)
        [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
    ];

    // Default settings (can be changed by user)
    let horizontalIsPositive = true;
    
    // Setup grid size control
    if (applyGridSizeBtn) {
        applyGridSizeBtn.addEventListener('click', function() {
            const newRows = parseInt(gridRowsInput.value);
            const newCols = parseInt(gridColsInput.value);
            
            // Validate input
            if (isNaN(newRows) || isNaN(newCols) || newRows < 2 || newCols < 2 || newRows > 10 || newCols > 10) {
                alert('Grid dimensions must be between 2 and 10');
                return;
            }
            
            updateGridSize(newRows, newCols);
        });
    }
    
    // Function to update the grid size
    function updateGridSize(rows, cols) {
        makeApiCall('/update_grid_size', 'POST', { rows, cols })
            .then(data => {
                if (data.success) {
                    gridRows = data.grid_rows;
                    gridCols = data.grid_cols;
                    recreateGrids();
                    updateGridStats(gridRows, gridCols);
                    updateOutputDisplay(0, 0);
                }
            });
    }
    
    // Function to recreate both input and weight grids
    function recreateGrids() {
        recreateInputGrid(gridRows, gridCols);
        recreateWeightGrid(gridRows, gridCols);
        // Initialize knobs and underglows for the new grids
        initializeKnobs();
        initializeUnderglows();
    }
    
    // Function to update grid statistics display
    function updateGridStats(rows, cols) {
        const totalInputs = rows * cols;
        const totalWeights = totalInputs + 1; // +1 for bias
        
        document.getElementById('total-inputs').textContent = totalInputs;
        document.getElementById('total-weights').textContent = totalWeights;
    }
    
    // Function to create a new input grid
    function recreateInputGrid(rows, cols) {
        const inputGrid = document.querySelector('.input-grid');
        inputGrid.innerHTML = '';
        
        // Update the grid template columns and rows
        inputGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        inputGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        // Create grid cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.dataset.value = 0;
                
                // Add the switch handle and rivets
                const switchHandle = document.createElement('div');
                switchHandle.className = 'switch-handle';
                cell.appendChild(switchHandle);
                
                // Add rivets
                for (let i = 1; i <= 4; i++) {
                    const rivet = document.createElement('div');
                    rivet.className = `rivet-${i}`;
                    cell.appendChild(rivet);
                }
                
                // Add click event - reusing the same handler for consistency
                cell.addEventListener('click', handleGridCellClick);
                
                inputGrid.appendChild(cell);
            }
        }
    }
    
    // Function to create a new weight grid
    function recreateWeightGrid(rows, cols) {
        const weightGrid = document.querySelector('.weight-grid');
        weightGrid.innerHTML = '';
        
        // Update the grid template columns and rows
        weightGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        weightGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        
        // Create weight controls
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const weightControl = document.createElement('div');
                weightControl.className = 'weight-control';
                
                const knobControlGroup = document.createElement('div');
                knobControlGroup.className = 'knob-control-group';
                
                // Minus button
                const minusBtn = document.createElement('button');
                minusBtn.className = 'knob-button minus';
                minusBtn.dataset.row = row;
                minusBtn.dataset.col = col;
                minusBtn.textContent = '-';
                minusBtn.addEventListener('click', function() {
                    adjustWeightKnob(row, col, -1);
                });
                
                // Weight knob
                const knob = document.createElement('div');
                knob.className = 'weight-knob knob';
                knob.id = `weight-${row}-${col}`;
                knob.dataset.row = row;
                knob.dataset.col = col;
                knob.dataset.value = 0;
                
                const knobIndicator = document.createElement('div');
                knobIndicator.className = 'knob-indicator';
                knob.appendChild(knobIndicator);
                
                // Plus button
                const plusBtn = document.createElement('button');
                plusBtn.className = 'knob-button plus';
                plusBtn.dataset.row = row;
                plusBtn.dataset.col = col;
                plusBtn.textContent = '+';
                plusBtn.addEventListener('click', function() {
                    adjustWeightKnob(row, col, 1);
                });
                
                // Weight value display
                const weightValue = document.createElement('div');
                weightValue.className = 'weight-value';
                weightValue.id = `weight-${row}-${col}-value`;
                weightValue.textContent = '0.00';
                
                // Assemble the weight control
                knobControlGroup.appendChild(minusBtn);
                knobControlGroup.appendChild(knob);
                knobControlGroup.appendChild(plusBtn);
                weightControl.appendChild(knobControlGroup);
                weightControl.appendChild(weightValue);
                
                weightGrid.appendChild(weightControl);
            }
        }
        
        // Setup weight knob rotation handlers
        const weightKnobs = document.querySelectorAll('.weight-knob');
        setupKnobEvents(weightKnobs, updateWeight);
    }
    
    if (closeTutorialBtn) {
        closeTutorialBtn.addEventListener('click', function() {
            tutorialOverlay.classList.remove('visible');
            localStorage.setItem('tutorialViewed', 'true');
        });
    }
    
    // Experiment Instructions event listeners
    experimentInstructionsButton.addEventListener('click', function() {
        experimentInstructionsOverlay.classList.add('visible');
    });
    
    closeExperimentInstructionsButton.addEventListener('click', function() {
        experimentInstructionsOverlay.classList.remove('visible');
    });
    
    // Setup pattern apply buttons
    patternApplyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pattern = this.dataset.pattern;
            if (pattern === 't') {
                applyPattern('horizontal');
            } else if (pattern === 'j') {
                applyPattern('vertical');
            }
        });
    });
    
    // Setup input grid click handlers for initial static cells
    gridCells.forEach(cell => {
        cell.addEventListener('click', handleGridCellClick);
    });
    
    // Reusable handler for grid cell clicks
    function handleGridCellClick() {
        const row = parseInt(this.dataset.row);
        const col = parseInt(this.dataset.col);
        const currentValue = parseInt(this.dataset.value);
        const newValue = currentValue === 1 ? 0 : 1;
        
        // Update visual state
        this.dataset.value = newValue;
        
        // Play switch flip sound effect
        playSound('switch-sound');
        
        // Add a slight bounce animation to the switch handle
        const switchHandle = this.querySelector('.switch-handle');
        if (switchHandle) {
            switchHandle.classList.add('flipping');
            setTimeout(() => {
                switchHandle.classList.remove('flipping');
            }, 300);
        }
        
        // Update the corresponding weight knob underglow
        updateWeightKnobUnderglow(row, col, newValue);
        
        // Send update to server
        updateInput(row, col, newValue);
    }
    
    // Setup weight knob rotation handlers
    const weightKnobs = document.querySelectorAll('.weight-knob');
    setupKnobEvents(weightKnobs, updateWeight);
    
    // Setup bias knob rotation handler
    const biasKnob = document.getElementById('bias-knob');
    if (biasKnob) {
        setupKnobEvents([biasKnob], updateBias);
    }
    
    // Setup learning rate handler
    const learningRateSlider = document.getElementById('learning-rate');
    if (learningRateSlider) {
        learningRateSlider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            document.getElementById('learning-rate-value').textContent = value.toFixed(2);
            
            // Send update to server
            updateLearningRate(value);
        });
    }
    
    // Setup +/- button handlers for weight knobs
    const minusButtons = document.querySelectorAll('.knob-button.minus');
    const plusButtons = document.querySelectorAll('.knob-button.plus');
    
    // Helper function to adjust weight knob by increment
    function adjustWeightKnob(row, col, direction) {
        const knob = document.getElementById(`weight-${row}-${col}`);
        const currentValue = parseFloat(knob.dataset.value) || 0;
        const learningRate = parseFloat(document.getElementById('learning-rate').value) || 0.1;
        
        // Calculate new value based on direction (1 for increment, -1 for decrement)
        let newValue = currentValue + (direction * learningRate);
        // Clamp value between -3 and 3
        newValue = Math.max(-3, Math.min(3, newValue));
        
        updateKnobRotation(knob, newValue);
        document.getElementById(`weight-${row}-${col}-value`).textContent = newValue.toFixed(2);
        updateWeight(row, col, newValue);
    }
    
    // Helper function to adjust bias knob by increment
    function adjustBiasKnob(direction) {
        const biasKnob = document.getElementById('bias-knob');
        const currentValue = parseFloat(biasKnob.dataset.value) || 0;
        const learningRate = parseFloat(document.getElementById('learning-rate').value) || 0.1;
        
        // Calculate new value based on direction (1 for increment, -1 for decrement)
        let newValue = currentValue + (direction * learningRate);
        // Clamp value between -3 and 3
        newValue = Math.max(-3, Math.min(3, newValue));
        
        updateKnobRotation(biasKnob, newValue);
        document.getElementById('bias-value').textContent = newValue.toFixed(2);
        updateBias(newValue);
    }
    
    // Helper function to play a sound
    function playSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play();
        }
    }
    
    minusButtons.forEach(button => {
        button.addEventListener('click', function() {
            // If it's for the bias knob
            if (this.id === 'bias-minus') {
                adjustBiasKnob(-1);
            } 
            // Otherwise it's for a weight knob
            else {
                const row = parseInt(this.dataset.row);
                const col = parseInt(this.dataset.col);
                adjustWeightKnob(row, col, -1);
            }
        });
    });
    
    plusButtons.forEach(button => {
        button.addEventListener('click', function() {
            // If it's for the bias knob
            if (this.id === 'bias-plus') {
                adjustBiasKnob(1);
            } 
            // Otherwise it's for a weight knob
            else {
                const row = parseInt(this.dataset.row);
                const col = parseInt(this.dataset.col);
                adjustWeightKnob(row, col, 1);
            }
        });
    });
    
    // Setup reset button handler
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            resetPerceptron();
        });
    }
    
    // Setup randomize button handler
    const randomizeButton = document.getElementById('randomize-button');
    if (randomizeButton) {
        randomizeButton.addEventListener('click', function() {
            randomizeWeights();
        });
    }
    
    // Initialize knobs with their current values
    initializeKnobs();
    initializeUnderglows();
    
    // Calculate initial perceptron output
    calculateOutput();
    
    // Helper function to update input
    function updateInput(row, col, value) {
        makeApiCall('/update_input', 'POST', { row, col, value })
            .then(data => {
                updateOutputDisplay(data.z, data.output);
                if (data.decision_boundary) {
                    updatePatternDisplay(data);
                }
            });
    }
    
    // Helper function to update weight
    function updateWeight(row, col, value) {
        makeApiCall('/update_weight', 'POST', { row, col, value })
            .then(data => {
                updateOutputDisplay(data.z, data.output);
                updatePatternDisplay(data);
            });
    }
    
    // Helper function to update bias
    function updateBias(value) {
        makeApiCall('/update_bias', 'POST', { value })
            .then(data => {
                updateOutputDisplay(data.z, data.output);
                updatePatternDisplay(data);
            });
    }
    
    // Helper function to update learning rate
    function updateLearningRate(value) {
        makeApiCall('/update_learning_rate', 'POST', { value })
            .catch(error => console.error('Error updating learning rate:', error));
    }
    
    // Helper function to reset perceptron
    function resetPerceptron() {
        makeApiCall('/reset', 'POST')
            .then(data => {
                if (data.success) {
                    // Reset input grid
                    const gridCells = document.querySelectorAll('.grid-cell');
                    gridCells.forEach(cell => {
                        cell.dataset.value = "0";
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        updateWeightKnobUnderglow(row, col, 0);
                    });

                    // Reset weights and bias
                    const weightKnobs = document.querySelectorAll('.weight-knob');
                    weightKnobs.forEach(knob => {
                        const row = parseInt(knob.dataset.row);
                        const col = parseInt(knob.dataset.col);
                        updateKnobRotation(knob, 0);
                        document.getElementById(`weight-${row}-${col}-value`).textContent = "0.00";
                    });

                    // Reset bias knob
                    const biasKnob = document.getElementById('bias-knob');
                    if (biasKnob) {
                        updateKnobRotation(biasKnob, 0);
                        document.getElementById('bias-value').textContent = "0.00";
                    }

                    // Reset learning rate
                    const learningRateSlider = document.getElementById('learning-rate');
                    if (learningRateSlider) {
                        learningRateSlider.value = 0.1;
                        document.getElementById('learning-rate-value').textContent = "0.10";
                    }

                    // Update displays
                    updateOutputDisplay(0, 0);
                    updatePatternDisplay(data);

                    // Play reset sound if available
                    const switchSound = document.getElementById('switch-sound');
                    if (switchSound) {
                        switchSound.currentTime = 0;
                        switchSound.play();
                    }
                }
            });
    }
    
    // Helper function to randomize weights
    function randomizeWeights() {
        makeApiCall('/randomize_weights', 'POST')
            .then(data => {
                if (data.success) {
                    updateWeightsUI(data.weights, data.bias);
                    updateOutputDisplay(data.z, data.output);
                    updatePatternDisplay(data);
                }
            });
    }
    
    // Helper function to setup knob rotation events
    function setupKnobEvents(knobElements, updateCallback) {
        knobElements.forEach(knob => {
            let isDragging = false;
            let startY = 0;
            let startValue = 0;
            
            knob.addEventListener('mousedown', startDrag);
            knob.addEventListener('touchstart', handleTouchStart);
            
            function startDrag(e) {
                isDragging = true;
                startY = e.clientY;
                startValue = parseFloat(knob.dataset.value) || 0;
                
                document.addEventListener('mousemove', drag);
                document.addEventListener('mouseup', stopDrag);
                
                // Prevent text selection during drag
                e.preventDefault();
            }
            
            function handleTouchStart(e) {
                const touch = e.touches[0];
                isDragging = true;
                startY = touch.clientY;
                startValue = parseFloat(knob.dataset.value) || 0;
                
                document.addEventListener('touchmove', handleTouchMove);
                document.addEventListener('touchend', handleTouchEnd);
                
                // Prevent scrolling during touch
                e.preventDefault();
            }
            
            function drag(e) {
                if (!isDragging) return;
                
                const deltaY = startY - e.clientY;
                const sensitivity = 0.01; // Adjust sensitivity as needed
                const learningRate = parseFloat(document.getElementById('learning-rate').value) || 0.1;
                
                // Calculate new value with learning rate as increment
                let newValue = startValue + (deltaY * sensitivity * learningRate);
                
                // Clamp value between -3 and 3
                newValue = Math.max(-3, Math.min(3, newValue));
                
                // Update knob rotation and value
                updateKnobRotation(knob, newValue);
                
                // If it's a weight knob
                if (knob.classList.contains('weight-knob')) {
                    const row = parseInt(knob.dataset.row);
                    const col = parseInt(knob.dataset.col);
                    document.getElementById(`weight-${row}-${col}-value`).textContent = newValue.toFixed(2);
                    updateCallback(row, col, newValue);
                } else {
                    // It's the bias knob
                    document.getElementById('bias-value').textContent = newValue.toFixed(2);
                    updateCallback(newValue);
                }
            }
            
            function handleTouchMove(e) {
                if (!isDragging) return;
                
                const touch = e.touches[0];
                const deltaY = startY - touch.clientY;
                const sensitivity = 0.01;
                const learningRate = parseFloat(document.getElementById('learning-rate').value) || 0.1;
                
                let newValue = startValue + (deltaY * sensitivity * learningRate);
                newValue = Math.max(-3, Math.min(3, newValue));
                
                updateKnobRotation(knob, newValue);
                
                if (knob.classList.contains('weight-knob')) {
                    const row = parseInt(knob.dataset.row);
                    const col = parseInt(knob.dataset.col);
                    document.getElementById(`weight-${row}-${col}-value`).textContent = newValue.toFixed(2);
                    updateCallback(row, col, newValue);
                } else {
                    document.getElementById('bias-value').textContent = newValue.toFixed(2);
                    updateCallback(newValue);
                }
            }
            
            function stopDrag() {
                isDragging = false;
                document.removeEventListener('mousemove', drag);
                document.removeEventListener('mouseup', stopDrag);
            }
            
            function handleTouchEnd() {
                isDragging = false;
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
            }
        });
    }
    
    // Helper function to update knob rotation
    function updateKnobRotation(knob, value) {
        // Update the data attribute
        knob.dataset.value = value;
        
        // Calculate rotation angle (map -3 to 3 to -135 to 135 degrees)
        const angle = (value / 3) * 135;
        
        // Update the knob indicator rotation
        const indicator = knob.querySelector('.knob-indicator');
        if (indicator) {
            indicator.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
        }
    }
    
    // Helper function to initialize knobs based on their data-value
    function initializeKnobs() {
        const allKnobs = document.querySelectorAll('.knob');
        allKnobs.forEach(knob => {
            const value = parseFloat(knob.dataset.value) || 0;
            updateKnobRotation(knob, value);
        });
    }
    
    // Helper function to update weight knob underglow based on input state
    function updateWeightKnobUnderglow(row, col, inputValue) {
        const weightKnob = document.querySelector(`.weight-knob[data-row="${row}"][data-col="${col}"]`);
        if (weightKnob) {
            if (inputValue === 1) {
                weightKnob.classList.add('input-active');
            } else {
                weightKnob.classList.remove('input-active');
            }
        }
    }
    
    // Initialize underglows based on current input values
    function initializeUnderglows() {
        const currentGridCells = document.querySelectorAll('.grid-cell');
        currentGridCells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = parseInt(cell.dataset.value);
            updateWeightKnobUnderglow(row, col, value);
        });
    }
    
    // Helper function to update the output display
    function updateOutputDisplay(z, output) {
        // Update net input value
        document.getElementById('net-input-value').textContent = z.toFixed(2);
        
        // Update output value
        document.getElementById('output-value').textContent = `Output = ${output}`;
        
        // Update output light
        const outputLight = document.getElementById('output-light');
        if (output > 0) {
            outputLight.classList.add('active');
        } else {
            outputLight.classList.remove('active');
        }
        
        // Update decision bulb
        if (decisionBulb) {
            if (output > 0) {
                decisionBulb.classList.add('active');
            } else {
                decisionBulb.classList.remove('active');
            }
        }
        
        // Update meter needle
        const meterNeedle = document.getElementById('meter-needle');
        // Map z value (-3 to 3) to rotation angle (-45 to 45 degrees)
        const angle = Math.max(-45, Math.min(45, (z / 3) * 45));
        meterNeedle.style.transform = `rotate(${angle}deg)`;
    }
    
    // Helper function to update the pattern display
    function updatePatternDisplay(data) {
        // Get current grid dimensions
        const currentGridRows = gridRows;
        const currentGridCols = gridCols;
        
        // Define Horizontal Line coordinates (middle row)
        const middleRow = Math.floor(currentGridRows / 2);
        const tPatternCoords = [];
        for (let col = 0; col < currentGridCols; col++) {
            tPatternCoords.push({x: col, y: middleRow});
        }
        
        // Define Vertical Line coordinates (middle column)
        const middleCol = Math.floor(currentGridCols / 2);
        const jPatternCoords = [];
        for (let row = 0; row < currentGridRows; row++) {
            jPatternCoords.push({x: middleCol, y: row});
        }
        
        // Calculate the net input for the T pattern (horizontal)
        let tNetInput = data.perceptron_state ? data.perceptron_state.bias : data.bias;
        const inputSize = currentGridRows * currentGridCols;
        let tInputs = Array(inputSize).fill(0);
        tPatternCoords.forEach(coord => {
            const idx = coord.y * currentGridCols + coord.x;
            if (idx < inputSize) {
                tInputs[idx] = 1;
            }
        });
        
        const weights = data.perceptron_state ? data.perceptron_state.weights : data.decision_boundary.weights;
        
        for (let i = 0; i < Math.min(tInputs.length, weights.length); i++) {
            tNetInput += tInputs[i] * weights[i];
        }
        const tOutput = tNetInput > 0 ? 1 : 0;
        
        // Calculate the net input for the J pattern (vertical)
        let jNetInput = data.perceptron_state ? data.perceptron_state.bias : data.bias;
        let jInputs = Array(inputSize).fill(0);
        jPatternCoords.forEach(coord => {
            const idx = coord.y * currentGridCols + coord.x;
            if (idx < inputSize) {
                jInputs[idx] = 1;
            }
        });
        
        for (let i = 0; i < Math.min(jInputs.length, weights.length); i++) {
            jNetInput += jInputs[i] * weights[i];
        }
        const jOutput = jNetInput > 0 ? 1 : 0;
        
        // Add explanatory text
        const explanationText = document.getElementById('boundary-explanation');
        if (explanationText) {
            explanationText.innerHTML = `
                <p>The perceptron classifies patterns based on their weighted sum:</p>
                <ul>
                    <li>Output = 1 when the weighted sum + bias > 0</li>
                    <li>Output = 0 when the weighted sum + bias ≤ 0</li>
                </ul>
                <p>Current classification results:</p>
                <ul>
                    <li>Horizontal Line: Net input (z) = ${tNetInput.toFixed(2)}, Output = ${tOutput}</li>
                    <li>Vertical Line: Net input (z) = ${jNetInput.toFixed(2)}, Output = ${jOutput}</li>
                </ul>
            `;
        }
        
        // Update pattern display
        const patternDisplay = document.getElementById('pattern-display');
        if (patternDisplay) {
            patternDisplay.innerHTML = '';
            patternDisplay.appendChild(createPatternGrid(tPatternCoords, 'Horizontal', tOutput));
            patternDisplay.appendChild(createPatternGrid(jPatternCoords, 'Vertical', jOutput));
        }
    }
    
    // Create visual grids for pattern visualization
    function createPatternGrid(pattern, name, output) {
        const outputClass = output === 1 ? 'positive' : 'negative';
        const grid = document.createElement('div');
        grid.className = 'pattern-container';
        
        // Determine grid dimensions from pattern
        let maxX = 3, maxY = 3;
        pattern.forEach(coord => {
            maxX = Math.max(maxX, coord.x);
            maxY = Math.max(maxY, coord.y);
        });
        
        // Create a grid of at least 4x4 or larger if needed
        const displayGridSize = Math.max(4, Math.max(maxX, maxY) + 1);
        
        let gridHTML = `<div class="pattern-grid" style="grid-template-columns: repeat(${displayGridSize}, 1fr); grid-template-rows: repeat(${displayGridSize}, 1fr);">`;
        for (let y = 0; y < displayGridSize; y++) {
            for (let x = 0; x < displayGridSize; x++) {
                // Check if this coordinate is part of the pattern
                const isActive = pattern.some(coord => coord.x === x && coord.y === y);
                gridHTML += `<div class="pattern-cell ${isActive ? 'active' : ''}"></div>`;
            }
        }
        gridHTML += `</div>`;
        gridHTML += `<div class="pattern-label ${outputClass}">"${name}" - Output: ${output}</div>`;
        
        grid.innerHTML = gridHTML;
        return grid;
    }
    
    // Helper function to calculate initial output
    function calculateOutput() {
        // Get all input values
        const inputs = [];
        gridCells.forEach(cell => {
            inputs.push(parseInt(cell.dataset.value));
        });
        
        // Get all weight values
        const weights = [];
        weightKnobs.forEach(knob => {
            weights.push(parseFloat(knob.dataset.value) || 0);
        });
        
        // Get bias value
        const bias = parseFloat(biasKnob.dataset.value) || 0;
        
        // Calculate net input (z)
        let z = bias;
        for (let i = 0; i < inputs.length; i++) {
            z += inputs[i] * weights[i];
        }
        
        // Calculate output
        const output = z > 0 ? 1 : 0;
        
        // Update display
        updateOutputDisplay(z, output);
        
        // Update pattern display
        updatePatternDisplay({
            perceptron_state: {
                weights: weights,
                bias: bias,
                inputs: inputs
            }
        });
    }
    
    // Initialize grid stats on page load
    updateGridStats(gridRows, gridCols);
    
    // Initialize mini grid
    function initializeMiniGrid() {
        miniGrid.innerHTML = '';
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cell = document.createElement('div');
                cell.className = 'mini-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                miniGrid.appendChild(cell);
            }
        }
    }
    
    // Initialize auto training UI
    function initializeAutoTraining() {
        initializeMiniGrid();
        
        console.log("Initializing auto training UI");
        
        // Setup event listeners for the toggle button
        if (toggleAutoTrainingBtn) {
            console.log("Auto train toggle button found, setting up event listener");
            
            // Add event listener to the button
            toggleAutoTrainingBtn.addEventListener('click', toggleAutoTrainMode);
        } else {
            console.error("Auto train toggle button not found!");
        }
        
        setTargetPatternBtn.addEventListener('click', setTargetPattern);
        startTrainingBtn.addEventListener('click', startTraining);
        pauseTrainingBtn.addEventListener('click', pauseTraining);
        resetTrainingBtn.addEventListener('click', resetTraining);
        
        trainingSpeedSlider.addEventListener('input', function() {
            trainingSpeed = parseInt(this.value);
            trainingSpeedValue.textContent = `${trainingSpeed} patterns/sec`;
            
            // If training is in progress, update the interval
            if (isTraining) {
                clearInterval(trainingInterval);
                trainingInterval = setInterval(trainStep, 1000 / trainingSpeed);
            }
        });
        
        maxIterationsInput.addEventListener('input', function() {
            maxIterations = parseInt(this.value);
        });
    }
    
    // Toggle auto train mode
    function toggleAutoTrainMode() {
        console.log("Toggle auto train mode button clicked");
        isAutoTrainModeEnabled = !isAutoTrainModeEnabled;
        
        // Add or remove auto-train-active class from body for styling
        document.body.classList.toggle('auto-train-active', isAutoTrainModeEnabled);
        
        if (isAutoTrainModeEnabled) {
            console.log("Enabling auto training mode");
            // Update button style to show active state
            toggleAutoTrainingBtn.classList.add('active');
            toggleAutoTrainingBtn.textContent = "Auto Training: ON";
            
            // Show auto training controls
            autoTrainingControls.classList.remove('hidden');
            
            // Lock grid size to 4x4
            if (gridRows !== 4 || gridCols !== 4) {
                console.log("Updating grid size to 4x4");
                // Update grid size inputs
                gridRowsInput.value = 4;
                gridColsInput.value = 4;
                
                // Force grid size update
                updateGridSize(4, 4);
                
                // Disable grid size controls
                gridRowsInput.disabled = true;
                gridColsInput.disabled = true;
                applyGridSizeBtn.disabled = true;
            }
            
            // Setup for Rosenblatt's experiment
            initializeRosenblattExperiment();
            
            // Add historical context
            addRosenblattHistoricalContext();
            
            // Show notification if auto train mode is enabled
            const notification = document.createElement('div');
            notification.className = 'steampunk-notification';
            notification.innerHTML = `
                <div class="notification-content">
                    <h3>Rosenblatt's Line Pattern Experiment</h3>
                    <p>Auto Training Mode is set to re-create the classic 1958 perceptron experiment.</p>
                    <p>The perceptron will be trained to recognize the T pattern (positive) and reject the J pattern (negative).</p>
                    <p>Click "Start Training" to begin the experiment.</p>
                </div>
            `;
            document.body.appendChild(notification);
            
            // Remove notification after 10 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    notification.remove();
                }, 500);
            }, 10000);
        } else {
            console.log("Disabling auto training mode");
            // Update button style to show inactive state
            toggleAutoTrainingBtn.classList.remove('active');
            toggleAutoTrainingBtn.textContent = "Auto Training Mode";
            
            // Hide auto training controls
            autoTrainingControls.classList.add('hidden');
            
            // End training if in progress
            if (isTraining) {
                pauseTraining();
            }
            
            // Reset training
            resetTraining();
            
            // Enable grid size controls
            gridRowsInput.disabled = false;
            gridColsInput.disabled = false;
            applyGridSizeBtn.disabled = false;
            
            // Remove historical context if it exists
            const historicalPanel = document.getElementById('rosenblatt-historical-context');
            if (historicalPanel) {
                historicalPanel.remove();
            }
            
            // Restore original target pattern display
            const targetPatternSection = document.querySelector('.target-pattern-display');
            if (targetPatternSection) {
                targetPatternSection.innerHTML = `
                    <div class="pattern-label">Target Pattern</div>
                    <div class="mini-grid"></div>
                `;
            }
            
            // Remove test patterns container if it exists
            const testPatternsContainer = document.getElementById('test-patterns-container');
            if (testPatternsContainer) {
                testPatternsContainer.remove();
            }
            
            // Show the set target pattern button
            if (setTargetPatternBtn) {
                setTargetPatternBtn.style.display = 'block';
            }
        }
    }
    
    // Add historical context about Rosenblatt's experiment
    function addRosenblattHistoricalContext() {
        // Check if historical context already exists
        if (document.getElementById('rosenblatt-historical-context')) {
            return;
        }
        
        // Create historical context panel
        const historicalPanel = document.createElement('div');
        historicalPanel.id = 'rosenblatt-historical-context';
        historicalPanel.className = 'steampunk-historical';
        historicalPanel.innerHTML = `
            <h3>Historical Context: The Mark I Perceptron (1958)</h3>
            <div class="historical-image">
                <img src="https://upload.wikimedia.org/wikipedia/en/5/52/Mark_I_perceptron.jpeg" alt="Mark I Perceptron">
                <div class="caption">Frank Rosenblatt with the Mark I Perceptron at Cornell Aeronautical Laboratory</div>
            </div>
            <p>In 1958, Frank Rosenblatt created the first hardware implementation of a perceptron, called the Mark I Perceptron. 
            This machine was designed for image recognition and could learn to distinguish between simple patterns.</p>
            <p>One of the fundamental demonstrations was having the perceptron learn to distinguish between horizontal and vertical line patterns.
            The simplicity of these orthogonal patterns made them ideal for demonstrating the perceptron's learning capabilities
            using the limited hardware available at that time.</p>
            <p>This demonstration helped establish machine learning as a viable field of research and laid groundwork for 
            modern neural networks. The perceptron proved that machines could learn from examples through trial and error -
            a revolutionary concept in 1958.</p>
            <div class="historical-note">This simulation recreates the core principles of Rosenblatt's experiment using all possible horizontal and vertical line patterns on a 4x4 grid.</div>
        `;
        
        // Add to the DOM after the title section
        const titleSection = document.querySelector('.title-section');
        if (titleSection) {
            titleSection.after(historicalPanel);
        } else {
            // If no title section, add to the beginning of the main content
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.prepend(historicalPanel);
            }
        }
    }
    
    // Initialize Rosenblatt's experiment UI and settings
    function initializeRosenblattExperiment() {
        // Setup target pattern display for both horizontal and vertical patterns
        const targetPatternSection = document.querySelector('.target-pattern-display');
        if (targetPatternSection) {
            targetPatternSection.innerHTML = `
                <div class="pattern-label">Rosenblatt's Line Pattern Experiment (1958)</div>
                <div class="pattern-polarity-selector">
                    <div class="selector-label">Select Pattern Classification:</div>
                    <div class="selector-options">
                        <label class="radio-container">
                            <input type="radio" name="pattern-polarity" value="horizontal" checked>
                            <span class="radio-label">Horizontal = Positive (1), Vertical = Negative (0)</span>
                        </label>
                        <label class="radio-container">
                            <input type="radio" name="pattern-polarity" value="vertical">
                            <span class="radio-label">Vertical = Positive (1), Horizontal = Negative (0)</span>
                        </label>
                    </div>
                </div>
                <div class="pattern-dual-display">
                    <div class="pattern-container">
                        <div class="pattern-type-label" id="horizontal-pattern-label">Horizontal Lines (Positive)</div>
                        <div class="mini-grid-container">
                            ${createMultiPatternHTML(HORIZONTAL_PATTERNS)}
                        </div>
                    </div>
                    <div class="pattern-container">
                        <div class="pattern-type-label" id="vertical-pattern-label">Vertical Lines (Negative)</div>
                        <div class="mini-grid-container">
                            ${createMultiPatternHTML(VERTICAL_PATTERNS)}
                        </div>
                    </div>
                </div>
                <div class="experiment-description">
                    In 1958, Frank Rosenblatt demonstrated that a perceptron could learn to distinguish between different pattern types.
                    This recreation allows you to train a perceptron to classify horizontal and vertical lines, demonstrating
                    the fundamental principles of machine pattern recognition.
                </div>
            `;
            
            // Add event listeners to the radio buttons
            const radioButtons = document.querySelectorAll('input[name="pattern-polarity"]');
            radioButtons.forEach(radio => {
                radio.addEventListener('change', function() {
                    horizontalIsPositive = this.value === 'horizontal';
                    updatePatternLabels();
                    generateRosenblattTrainingPatterns();
                });
            });
        }
        
        // Hide "Set Current as Target Pattern" button since we're using predefined patterns
        if (setTargetPatternBtn) {
            setTargetPatternBtn.style.display = 'none';
        }
        
        // Set the default pattern classification
        updatePatternLabels();
        
        // Initialize training patterns 
        generateRosenblattTrainingPatterns();
        
        // Enable start training button
        startTrainingBtn.disabled = false;
    }
    
    // Update pattern labels based on user's selection
    function updatePatternLabels() {
        const horizontalLabel = document.getElementById('horizontal-pattern-label');
        const verticalLabel = document.getElementById('vertical-pattern-label');
        
        if (horizontalLabel && verticalLabel) {
            horizontalLabel.textContent = `Horizontal Lines (${horizontalIsPositive ? 'Positive' : 'Negative'})`;
            horizontalLabel.className = `pattern-type-label ${horizontalIsPositive ? 'positive' : 'negative'}`;
            
            verticalLabel.textContent = `Vertical Lines (${horizontalIsPositive ? 'Negative' : 'Positive'})`;
            verticalLabel.className = `pattern-type-label ${horizontalIsPositive ? 'negative' : 'positive'}`;
        }
    }
    
    // Helper function to create HTML for multiple mini-grids
    function createMultiPatternHTML(patterns) {
        let html = '';
        
        patterns.forEach((pattern, index) => {
            html += `
                <div class="mini-grid-wrapper">
                    <div class="mini-grid pattern-${index}">
                        ${createMiniGridHTML(pattern)}
                    </div>
                </div>
            `;
        });
        
        return html;
    }
    
    // Generate training patterns specifically for Rosenblatt's experiment
    function generateRosenblattTrainingPatterns() {
        console.log("========== GENERATING ROSENBLATT TRAINING PATTERNS ==========");
        console.log(`Pattern classification: Horizontal is ${horizontalIsPositive ? 'POSITIVE' : 'NEGATIVE'}`);
        
        trainingPatterns = [];
        
        // Add all horizontal patterns as examples
        console.log("Adding horizontal line patterns");
        for (const pattern of HORIZONTAL_PATTERNS) {
            trainingPatterns.push({
                pattern: [...pattern],
                expectedOutput: horizontalIsPositive ? 1 : 0,
                description: "HORIZONTAL_PATTERN"
            });
            
            // Add variations of each horizontal pattern
            addPatternVariations(pattern, horizontalIsPositive ? 1 : 0, 2);
        }
        
        // Add all vertical patterns as examples
        console.log("Adding vertical line patterns");
        for (const pattern of VERTICAL_PATTERNS) {
            trainingPatterns.push({
                pattern: [...pattern],
                expectedOutput: horizontalIsPositive ? 0 : 1,
                description: "VERTICAL_PATTERN"
            });
            
            // Add variations of each vertical pattern
            addPatternVariations(pattern, horizontalIsPositive ? 0 : 1, 2);
        }
        
        // Add some random patterns (all negative examples)
        console.log("Adding random patterns as negative examples");
        for (let i = 0; i < 5; i++) {
            // Create random pattern with 3-5 active cells
            const activeCount = Math.floor(Math.random() * 3) + 3;
            let randomPattern = Array(16).fill(0);
            
            for (let j = 0; j < activeCount; j++) {
                const randomCell = Math.floor(Math.random() * 16);
                randomPattern[randomCell] = 1;
            }
            
            // Make sure it's not too similar to any existing pattern
            if (!isPatternSimilarToAny(randomPattern, [...HORIZONTAL_PATTERNS, ...VERTICAL_PATTERNS])) {
                trainingPatterns.push({
                    pattern: randomPattern,
                    expectedOutput: 0, // Always negative
                    description: "RANDOM_PATTERN"
                });
            }
        }
        
        // Shuffle the training patterns to avoid sequential bias
        shuffleArray(trainingPatterns);
        
        // Log statistics about the training set
        const positivePatterns = trainingPatterns.filter(p => p.expectedOutput === 1).length;
        const negativePatterns = trainingPatterns.filter(p => p.expectedOutput === 0).length;
        console.log(`Training set generated with ${trainingPatterns.length} patterns:`);
        console.log(`- ${positivePatterns} positive examples (${Math.round(positivePatterns/trainingPatterns.length*100)}%)`);
        console.log(`- ${negativePatterns} negative examples (${Math.round(negativePatterns/trainingPatterns.length*100)}%)`);
        console.log("========== ROSENBLATT TRAINING PATTERNS READY ==========");
        
        // Set the display pattern based on the current classification
        const displayPattern = horizontalIsPositive ? HORIZONTAL_PATTERNS[1] : VERTICAL_PATTERNS[1];
        targetPattern = [...displayPattern];
    }
    
    // Add variations of a pattern to the training set
    function addPatternVariations(basePattern, expectedOutput, count) {
        for (let i = 0; i < count; i++) {
            // Create a variation with slight noise
            let variation = [...basePattern];
            
            // Add or remove 1-2 pixels
            const changes = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < changes; j++) {
                const index = Math.floor(Math.random() * 16);
                // Toggle the pixel (0->1 or 1->0)
                variation[index] = 1 - variation[index];
            }
            
            trainingPatterns.push({
                pattern: variation,
                expectedOutput: expectedOutput,
                description: `PATTERN_VARIATION_${i}`
            });
        }
    }
    
    // Check if a pattern is similar to any of the patterns in a list
    function isPatternSimilarToAny(pattern, patternList) {
        for (const existingPattern of patternList) {
            if (arePatternsVerySimilar(pattern, existingPattern)) {
                return true;
            }
        }
        return false;
    }
    
    // Test Rosenblatt's horizontal and vertical patterns and update UI
    function testRosenblattPatterns() {
        // Test all horizontal patterns
        const horizontalResults = HORIZONTAL_PATTERNS.map(pattern => {
            const output = calculateOutput(pattern);
            const classification = output >= threshold ? 1 : 0;
            const correct = classification === (horizontalIsPositive ? 1 : 0);
            return { pattern, output, classification, correct };
        });
        
        // Test all vertical patterns
        const verticalResults = VERTICAL_PATTERNS.map(pattern => {
            const output = calculateOutput(pattern);
            const classification = output >= threshold ? 1 : 0;
            const correct = classification === (horizontalIsPositive ? 0 : 1);
            return { pattern, output, classification, correct };
        });
        
        // Calculate accuracies
        const horizontalCorrect = horizontalResults.filter(r => r.correct).length;
        const horizontalAccuracy = (horizontalCorrect / horizontalResults.length) * 100;
        
        const verticalCorrect = verticalResults.filter(r => r.correct).length;
        const verticalAccuracy = (verticalCorrect / verticalResults.length) * 100;
        
        // Calculate overall accuracy
        const totalCorrect = horizontalCorrect + verticalCorrect;
        const totalTests = horizontalResults.length + verticalResults.length;
        const overallAccuracy = (totalCorrect / totalTests) * 100;
        
        // Log results
        console.log(`Horizontal Patterns: ${horizontalCorrect}/${horizontalResults.length} correct (${horizontalAccuracy.toFixed(1)}%)`);
        console.log(`Vertical Patterns: ${verticalCorrect}/${verticalResults.length} correct (${verticalAccuracy.toFixed(1)}%)`);
        console.log(`Overall Accuracy: ${overallAccuracy.toFixed(1)}%`);
        
        // Update the accuracy display
        accuracy = overallAccuracy;
        
        // Update progress bar
        if (progressBar) {
            progressBar.style.width = `${accuracy}%`;
            progressBar.textContent = `${Math.round(accuracy)}%`;
        }
        
        // Update pattern-specific accuracy indicators
        const horizontalAccuracyElement = document.getElementById('horizontal-pattern-accuracy');
        const verticalAccuracyElement = document.getElementById('vertical-pattern-accuracy');
        
        if (horizontalAccuracyElement) {
            const accuracyText = `${horizontalAccuracy.toFixed(0)}% Correct`;
            horizontalAccuracyElement.textContent = accuracyText;
            horizontalAccuracyElement.className = horizontalCorrect === horizontalResults.length ? "correct" : "partial";
        }
        
        if (verticalAccuracyElement) {
            const accuracyText = `${verticalAccuracy.toFixed(0)}% Correct`;
            verticalAccuracyElement.textContent = accuracyText;
            verticalAccuracyElement.className = verticalCorrect === verticalResults.length ? "correct" : "partial";
        }
        
        return overallAccuracy;
    }
    
    // Start auto-training process
    function startTraining() {
        if (!trainingPatterns || trainingPatterns.length === 0) {
            console.error("No training patterns available!");
            return;
        }
        
        if (isTraining) {
            console.log("Training already in progress");
            return;
        }
        
        console.log("========== STARTING TRAINING ==========");
        isTraining = true;
        
        // Update UI
        startTrainingBtn.disabled = true;
        pauseTrainingBtn.disabled = false;
        resetTrainingBtn.disabled = false;
        
        // Reset counters
        currentTrainingIndex = 0;
        document.getElementById('iteration-counter').textContent = '000';
        
        // Testing message in results
        const resultsArea = document.getElementById('training-results');
        resultsArea.innerHTML = '<div class="steampunk-log">Training in progress...</div>';
        
        // Initialize progress
        if (progressBarContainer && progressBar) {
            progressBarContainer.style.display = 'block';
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
        }
        
        // Add Rosenblatt test patterns UI if auto train mode is enabled
        if (isAutoTrainModeEnabled && progressBarContainer) {
            // Check if test patterns container already exists
            let testPatternsContainer = document.getElementById('test-patterns-container');
            if (!testPatternsContainer) {
                testPatternsContainer = document.createElement('div');
                testPatternsContainer.id = 'test-patterns-container';
                testPatternsContainer.className = 'test-patterns-container';
                testPatternsContainer.innerHTML = `
                    <div class="pattern-test-results">
                        <div class="pattern-test horizontal-test">
                            <div class="mini-grid">
                                ${createMiniGridHTML(HORIZONTAL_PATTERNS[1])}
                            </div>
                            <div class="test-result">Horizontal: <span id="horizontal-pattern-accuracy">Not tested</span></div>
                        </div>
                        <div class="pattern-test vertical-test">
                            <div class="mini-grid">
                                ${createMiniGridHTML(VERTICAL_PATTERNS[1])}
                            </div>
                            <div class="test-result">Vertical: <span id="vertical-pattern-accuracy">Not tested</span></div>
                        </div>
                    </div>
                `;
                progressBarContainer.after(testPatternsContainer);
            }
        }
        
        // Start the training loop
        trainingLoopInterval = setInterval(trainStep, 1000 / trainingSpeed);
        
        // Check progress periodically
        trainingProgressInterval = setInterval(() => {
            if (isAutoTrainModeEnabled) {
                // Test both pattern types for Rosenblatt's experiment
                const accuracy = testRosenblattPatterns();
                
                // Check if we've achieved high accuracy
                if (accuracy > 95) {
                    // If we've maintained high accuracy for several checks, consider training complete
                    if (++highAccuracyEpochs >= 3) {
                        pauseTraining();
                        const resultsArea = document.getElementById('training-results');
                        resultsArea.innerHTML += `
                            <div class="steampunk-log success">
                                Training successful! The perceptron has learned to distinguish between horizontal and vertical lines.
                            </div>
                            <div class="steampunk-log">
                                This recreates Frank Rosenblatt's 1958 demonstration of machine pattern recognition.
                            </div>
                        `;
                    }
                } else {
                    // Reset high accuracy counter
                    highAccuracyEpochs = 0;
                }
            }
        }, 1000); // Check progress every second
    }
    
    // Test the current input pattern (for manual testing)
    function manualTest() {
        if (!weights || weights.length === 0) {
            console.error("Weights not initialized!");
            return;
        }
        
        // Get current input pattern
        const currentPattern = [];
        const inputCells = document.querySelectorAll('.grid-cell');
        inputCells.forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = parseInt(cell.dataset.value);
            
            // Store in row-major order
            const index = row * gridCols + col;
            currentPattern[index] = value;
        });
        
        // Calculate output
        const output = calculateOutput(currentPattern);
        const classification = output >= threshold ? 1 : 0;
        
        // Show results
        const resultsContainer = document.getElementById('manual-test-results');
        
        if (isAutoTrainModeEnabled) {
            // In auto-training mode, evaluate pattern against horizontal and vertical types
            const horizontalSimilarities = HORIZONTAL_PATTERNS.map(pattern => 
                calculatePatternSimilarity(currentPattern, pattern));
            const verticalSimilarities = VERTICAL_PATTERNS.map(pattern => 
                calculatePatternSimilarity(currentPattern, pattern));
            
            // Get max similarity to each type
            const maxHorizontalSimilarity = Math.max(...horizontalSimilarities);
            const maxVerticalSimilarity = Math.max(...verticalSimilarities);
            
            // Determine classification label based on current settings
            const positiveType = horizontalIsPositive ? "Horizontal" : "Vertical";
            const negativeType = horizontalIsPositive ? "Vertical" : "Horizontal";
            const classificationLabel = classification === 1 ? positiveType : negativeType;
            
            resultsContainer.innerHTML = `
                <div class="steampunk-result">
                    <div class="result-header">Pattern Analysis</div>
                    <div class="result-item">
                        <span class="label">Raw Output:</span>
                        <span class="value">${output.toFixed(4)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Classification:</span>
                        <span class="value ${classification === 1 ? 'positive' : 'negative'}">
                            ${classificationLabel} Line Pattern (${classification})
                        </span>
                    </div>
                    <div class="result-divider"></div>
                    <div class="result-item">
                        <span class="label">Similarity to Horizontal:</span>
                        <span class="value">${(maxHorizontalSimilarity*100).toFixed(1)}%</span>
                        <div class="similarity-bar">
                            <div class="similarity-fill" style="width: ${maxHorizontalSimilarity*100}%"></div>
                        </div>
                    </div>
                    <div class="result-item">
                        <span class="label">Similarity to Vertical:</span>
                        <span class="value">${(maxVerticalSimilarity*100).toFixed(1)}%</span>
                        <div class="similarity-bar">
                            <div class="similarity-fill" style="width: ${maxVerticalSimilarity*100}%"></div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // In manual mode, compare to user's target pattern
            const patternIsTarget = targetPattern && arePatternsSame(currentPattern, targetPattern);
            
            resultsContainer.innerHTML = `
                <div class="steampunk-result">
                    <div class="result-item">
                        <span class="label">Raw Output:</span>
                        <span class="value">${output.toFixed(4)}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Classification:</span>
                        <span class="value ${classification === 1 ? 'positive' : 'negative'}">${classification}</span>
                    </div>
                    <div class="result-item">
                        <span class="label">Matches Target:</span>
                        <span class="value ${patternIsTarget ? 'positive' : 'negative'}">${patternIsTarget ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            `;
        }
    }
    
    // Initialize auto training module
    initializeAutoTraining();

    // Helper function to create HTML for mini-grid
    function createMiniGridHTML(pattern) {
        let html = '';
        for (let i = 0; i < pattern.length; i++) {
            const isActive = pattern[i] === 1;
            html += `<div class="mini-cell ${isActive ? 'active' : ''}"></div>`;
        }
        return html;
    }

    // Helper function to check if two patterns are very similar
    function arePatternsVerySimilar(pattern1, pattern2) {
        if (!pattern1 || !pattern2 || pattern1.length !== pattern2.length) {
            return false;
        }
        
        let sameCount = 0;
        for (let i = 0; i < pattern1.length; i++) {
            if (pattern1[i] === pattern2[i]) {
                sameCount++;
            }
        }
        
        // Consider them similar if 75% or more cells are the same
        return (sameCount / pattern1.length) >= 0.75;
    }

    // Calculate similarity between two patterns (as a percentage)
    function calculatePatternSimilarity(pattern1, pattern2) {
        if (!pattern1 || !pattern2 || pattern1.length !== pattern2.length) {
            return 0;
        }
        
        let matchCount = 0;
        for (let i = 0; i < pattern1.length; i++) {
            if (pattern1[i] === pattern2[i]) {
                matchCount++;
            }
        }
        
        return matchCount / pattern1.length;
    }

    // Helper function to make API calls
    function makeApiCall(endpoint, method, data) {
        return fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : null,
        })
        .then(response => response.json())
        .catch(error => console.error(`Error calling ${endpoint}:`, error));
    }

    // Helper function to update weights UI
    function updateWeightsUI(weights, bias) {
        // Update weight knobs
        const weightKnobs = document.querySelectorAll('.weight-knob');
        weightKnobs.forEach((knob, index) => {
            if (index < weights.length) {
                const value = weights[index];
                updateKnobRotation(knob, value);
                const row = parseInt(knob.dataset.row);
                const col = parseInt(knob.dataset.col);
                document.getElementById(`weight-${row}-${col}-value`).textContent = 
                    value.toFixed(2);
            }
        });
        
        // Update bias knob
        if (biasKnob) {
            updateKnobRotation(biasKnob, bias);
            document.getElementById('bias-value').textContent = bias.toFixed(2);
        }
    }

    // Helper function to apply pattern
    function applyPattern(pattern) {
        // Clear all inputs first
        const currentGridCells = document.querySelectorAll('.grid-cell');
        currentGridCells.forEach(cell => {
            cell.dataset.value = "0";
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            updateWeightKnobUnderglow(row, col, 0);
        });
        
        // Apply pattern based on type
        if (pattern === 'horizontal') {
            const middleRow = Math.floor(gridRows / 2);
            for (let col = 0; col < gridCols; col++) {
                applyInputValue(middleRow, col, 1);
            }
        } else if (pattern === 'vertical') {
            const middleCol = Math.floor(gridCols / 2);
            for (let row = 0; row < gridRows; row++) {
                applyInputValue(row, middleCol, 1);
            }
        }
        
        calculateOutput();
    }

    // Helper function to apply input value and update UI
    function applyInputValue(row, col, value) {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.dataset.value = value;
            updateWeightKnobUnderglow(row, col, value);
            updateInput(row, col, value);
        }
    }

    // Add trainStep function after startTraining
    function trainStep() {
        if (!isTraining || !trainingPatterns || currentTrainingIndex >= trainingPatterns.length) {
            return;
        }

        // Get current training pattern
        const pattern = trainingPatterns[currentTrainingIndex];
        
        // Apply pattern to the grid
        const gridCells = document.querySelectorAll('.grid-cell');
        gridCells.forEach((cell, index) => {
            const value = pattern.pattern[index];
            cell.dataset.value = value;
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            updateWeightKnobUnderglow(row, col, value);
        });

        // Calculate current output
        makeApiCall('/calculate_output', 'POST', { pattern: pattern.pattern })
            .then(data => {
                const output = data.output;
                const error = pattern.expectedOutput - output;

                // Update weights if there's an error
                if (error !== 0) {
                    // Get current learning rate
                    const learningRate = parseFloat(document.getElementById('learning-rate').value);

                    // Update weights and bias based on the error
                    const weights = document.querySelectorAll('.weight-knob');
                    weights.forEach((knob, index) => {
                        const row = parseInt(knob.dataset.row);
                        const col = parseInt(knob.dataset.col);
                        const currentValue = parseFloat(knob.dataset.value) || 0;
                        const input = pattern.pattern[index];
                        const newValue = currentValue + (learningRate * error * input);
                        
                        // Update weight value
                        updateWeight(row, col, Math.max(-3, Math.min(3, newValue)));
                    });

                    // Update bias
                    const biasKnob = document.getElementById('bias-knob');
                    const currentBias = parseFloat(biasKnob.dataset.value) || 0;
                    const newBias = currentBias + (learningRate * error);
                    updateBias(Math.max(-3, Math.min(3, newBias)));
                }

                // Move to next pattern
                currentTrainingIndex = (currentTrainingIndex + 1) % trainingPatterns.length;
                
                // Update iteration counter if we've gone through all patterns
                if (currentTrainingIndex === 0) {
                    const iterationCounter = document.getElementById('iteration-counter');
                    const currentIteration = parseInt(iterationCounter.textContent) || 0;
                    iterationCounter.textContent = String(currentIteration + 1).padStart(3, '0');
                    
                    // Check if we've reached max iterations
                    const maxIterations = parseInt(document.getElementById('max-iterations').value);
                    if (currentIteration + 1 >= maxIterations) {
                        pauseTraining();
                        const resultsArea = document.getElementById('training-results');
                        resultsArea.innerHTML += `
                            <div class="steampunk-log">
                                Training completed after ${maxIterations} iterations.
                            </div>
                        `;
                    }
                }
            });
    }

    // Add pauseTraining function
    function pauseTraining() {
        if (!isTraining) return;
        
        isTraining = false;
        clearInterval(trainingLoopInterval);
        clearInterval(trainingProgressInterval);
        
        // Update UI
        startTrainingBtn.disabled = false;
        pauseTrainingBtn.disabled = true;
        resetTrainingBtn.disabled = false;
        
        // Add pause message to results
        const resultsArea = document.getElementById('training-results');
        resultsArea.innerHTML += '<div class="steampunk-log">Training paused.</div>';
    }

    // Add resetTraining function
    function resetTraining() {
        // Stop training if in progress
        if (isTraining) {
            pauseTraining();
        }
        
        // Reset counters
        currentTrainingIndex = 0;
        document.getElementById('iteration-counter').textContent = '000';
        
        // Reset progress bar
        if (progressBar) {
            progressBar.style.width = '0%';
            progressBar.textContent = '0%';
        }
        
        // Reset perceptron state
        resetPerceptron();
        
        // Clear results
        const resultsArea = document.getElementById('training-results');
        resultsArea.innerHTML = '<div class="steampunk-log">Training reset.</div>';
        
        // Enable/disable buttons appropriately
        startTrainingBtn.disabled = false;
        pauseTrainingBtn.disabled = true;
        resetTrainingBtn.disabled = true;
    }
}); 