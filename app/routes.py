from flask import render_template, jsonify, request
from app import app
from app.perceptron import Perceptron
import random

# Initialize perceptron with default grid size
perceptron = Perceptron(input_size=16)
current_inputs = [0] * 16
grid_rows = 4
grid_cols = 4

# Helper functions for request handling
def get_grid_coordinates():
    """Get row, col, value from request data."""
    data = request.get_json()
    return (
        data.get('row', 0),
        data.get('col', 0),
        data.get('value', 0)
    )

def get_single_value(key='value', default=0):
    """Get a single value from request data."""
    data = request.get_json()
    return data.get(key, default)

def calculate_perceptron_output(inputs):
    """Calculate perceptron z and output values."""
    z = perceptron.calculate_net_input(inputs)
    output = perceptron.predict(inputs)
    return z, output

def create_output_response(z, output, **extra):
    """Create standard JSON response with output values."""
    response = {
        'success': True,
        'z': z,
        'output': output
    }
    response.update(extra)
    return jsonify(response)

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/update_input', methods=['POST'])
def update_input():
    """Update an input value in the grid."""
    row, col, value = get_grid_coordinates()
    
    # Update input in the flattened array
    index = row * grid_cols + col
    if 0 <= index < len(current_inputs):
        current_inputs[index] = value
    
    # Calculate new output
    z, output = calculate_perceptron_output(current_inputs)
    return create_output_response(z, output)

@app.route('/update_weight', methods=['POST'])
def update_weight():
    """Update a weight value."""
    row, col, value = get_grid_coordinates()
    
    # Update weight in the flattened array
    index = row * grid_cols + col
    if 0 <= index < len(perceptron.weights):
        perceptron.weights[index] = value
    
    # Calculate new output
    z, output = calculate_perceptron_output(current_inputs)
    return create_output_response(z, output)

@app.route('/update_bias', methods=['POST'])
def update_bias():
    """Update the bias value."""
    value = get_single_value('value', 0)
    perceptron.bias = value
    
    # Calculate new output
    z, output = calculate_perceptron_output(current_inputs)
    return create_output_response(z, output)

@app.route('/update_learning_rate', methods=['POST'])
def update_learning_rate():
    """Update the learning rate."""
    value = get_single_value('value', 0.1)
    perceptron.learning_rate = value
    return jsonify({'success': True})

@app.route('/reset', methods=['POST'])
def reset():
    """Reset the perceptron to initial state."""
    global current_inputs
    perceptron.weights = [0.0] * (grid_rows * grid_cols)
    perceptron.bias = 0.0
    current_inputs = [0] * (grid_rows * grid_cols)
    return jsonify({'success': True})

@app.route('/randomize_weights', methods=['POST'])
def randomize_weights():
    """Randomize the perceptron weights."""
    perceptron.weights = [random.uniform(-1, 1) for _ in range(grid_rows * grid_cols)]
    perceptron.bias = random.uniform(-1, 1)
    
    # Calculate new output
    z, output = calculate_perceptron_output(current_inputs)
    return create_output_response(z, output, weights=perceptron.weights, bias=perceptron.bias)

@app.route('/update_grid_size', methods=['POST'])
def update_grid_size():
    """Update the grid dimensions."""
    global grid_rows, grid_cols, current_inputs, perceptron
    
    data = request.get_json()
    new_rows = data.get('rows', 4)
    new_cols = data.get('cols', 4)
    
    # Update grid dimensions
    grid_rows = new_rows
    grid_cols = new_cols
    
    # Create new perceptron with updated input size
    perceptron = Perceptron(input_size=grid_rows * grid_cols)
    current_inputs = [0] * (grid_rows * grid_cols)
    
    return jsonify({
        'success': True,
        'grid_rows': grid_rows,
        'grid_cols': grid_cols
    })

@app.route('/calculate_output', methods=['POST'])
def calculate_output():
    """Calculate perceptron output for given inputs."""
    data = request.get_json()
    pattern = data.get('pattern', [])
    
    if len(pattern) != len(perceptron.weights):
        return jsonify({
            'success': False,
            'error': 'Pattern size does not match weight size'
        })
    
    z, output = calculate_perceptron_output(pattern)
    return create_output_response(z, output) 