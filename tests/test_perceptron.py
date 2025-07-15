import unittest
import sys
import os

# Add the parent directory to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.perceptron import Perceptron

class TestPerceptron(unittest.TestCase):
    def setUp(self):
        """Set up a perceptron instance for each test."""
        self.perceptron = Perceptron(input_size=16, learning_rate=0.1)
    
    def test_initialization(self):
        """Test that perceptron initializes correctly."""
        self.assertEqual(len(self.perceptron.weights), 16)
        self.assertEqual(self.perceptron.bias, 0.0)
        self.assertEqual(self.perceptron.learning_rate, 0.1)
        self.assertTrue(all(w == 0.0 for w in self.perceptron.weights))
    
    def test_calculate_net_input(self):
        """Test the calculation of net input."""
        self.perceptron.weights = [0.5] * 16
        self.perceptron.bias = 1.0
        inputs = [1] * 16
        self.assertEqual(self.perceptron.calculate_net_input(inputs), 9.0)
    
    def test_predict_zero(self):
        """Test prediction with zero net input (should return 0)."""
        self.perceptron.weights = [0] * 16
        self.perceptron.bias = 0
        inputs = [1] * 16
        self.assertEqual(self.perceptron.predict(inputs), 0)
    
    def test_predict_positive(self):
        """Test prediction with positive net input (should return 1)."""
        self.perceptron.weights = [1] * 16
        self.perceptron.bias = 0.5
        inputs = [1] * 16
        self.assertEqual(self.perceptron.predict(inputs), 1)
    
    def test_input_size_mismatch(self):
        """Test that error is raised when input size doesn't match weights."""
        with self.assertRaises(ValueError):
            self.perceptron.calculate_net_input([1] * 8)  # Wrong input size

if __name__ == '__main__':
    unittest.main() 