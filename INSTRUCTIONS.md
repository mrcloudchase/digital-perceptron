# Running the Digital Perceptron Web App

Follow these steps to set up and run the Digital Perceptron Web App on your local machine.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Installation

1. **Create a virtual environment**

   Open a terminal/command prompt and navigate to the project directory.

   ```bash
   # Create a virtual environment
   python3 -m venv venv
   ```

2. **Activate the virtual environment**

   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```

3. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

## Adding Texture Images

Before running the app, you need to add the following texture images to the `app/static/images/` directory:

1. `metal-texture.png` - A dark metal texture for the background
2. `wood-texture.png` - A wooden texture for the panels
3. `paper-texture.png` - A parchment texture for the tutorial overlay

You can find suitable images on stock photo websites or texture repositories.

## Running the Application

1. **Start the application**

   ```bash
   python run.py
   ```

2. **Access the app**

   Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

## Using the App

- **Input Grid**: Click cells to toggle between 0 (off) and 1 (on).
- **Weight Controls**: Drag knobs to adjust the importance of each input.
- **Bias Control**: Adjust the bias to shift the decision boundary.
- **Learning Rate**: Controls the increment size for adjustments.
- **Reset Button**: Resets all settings to their default values.

## Running Tests

To run the tests:

```bash
python -m pytest tests/
```

## Troubleshooting

- If the application fails to start, check that you have activated the virtual environment and installed all dependencies.
- If the styles don't appear correctly, ensure you've added the texture images to the correct directory.

## Future Development

The app is designed with a foundation for adding auto-training mode in the future, which will allow for:

- Dataset uploads or preset letter patterns
- Automated weight updates using Rosenblatt's learning rule
- Visualization of training progress 