# Digital Perceptron Web App

An interactive educational web application that emulates a 1950s physical perceptron machine as designed by Frank Rosenblatt. The app features a steampunk-themed UI with a 4×4 input grid, weight knobs, a bias control, and a learning rate control, while visualizing the perceptron's computation and decision boundary in real time.

## Features

- **Manual Mode:**
  - 4×4 input toggle grid
  - 4×4 weight knobs/sliders
  - Bias control knob/slider
  - Learning rate control
  - Reset functionality
  - Real-time analog output meter

- **Visualization Overlay:**
  - 2D scatter plot of input grid points
  - Dynamic linear decision boundary overlay
  - Clear on-screen directions

## Installation

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   ```

2. Activate the virtual environment:
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the application:
   ```bash
   flask run
   ```

5. Open your browser and navigate to `http://127.0.0.1:5000/`

## Technical Background

The perceptron is one of the earliest neural network models, invented by Frank Rosenblatt in the 1950s. It computes a weighted sum of its inputs, adds a bias, and produces a binary output based on whether this sum exceeds a threshold.

### Forward Pass Calculation:
- **Input:** A 4×4 grid (16 binary values) flattened into a vector
- **Weights:** A corresponding 4×4 weight matrix, flattened
- **Bias:** A scalar value
- **Net Input:** z = Σ(wi·xi) + b
- **Activation:** y = 1 if z ≥ 0, else 0

## Usage

1. Toggle input cells to set binary inputs (1 or 0)
2. Adjust weight knobs to set the importance of each input
3. Set the bias to adjust the threshold
4. Use the learning rate to control adjustment increments
5. Observe the output meter and decision boundary

## License

MIT 