class Perceptron:
    def __init__(self, input_size=16, learning_rate=0.1):
        """
        Initialize the perceptron with zeros for weights and bias.
        
        Args:
            input_size (int): The number of input features
            learning_rate (float): The learning rate for weight updates
        """
        self.weights = [0.0] * input_size
        self.bias = 0.0
        self.learning_rate = learning_rate
        self.input_size = input_size
    
    def calculate_net_input(self, inputs):
        """
        Compute the weighted sum of the inputs plus bias.
        
        Args:
            inputs (list): The input values
            
        Returns:
            float: The net input (z)
        """
        if len(inputs) != len(self.weights):
            raise ValueError(f"Input size {len(inputs)} does not match weight size {len(self.weights)}")
        return sum(w * x for w, x in zip(self.weights, inputs)) + self.bias
    
    def predict(self, inputs):
        """
        Apply the step activation function to the net input.
        
        Args:
            inputs (list): The input values
            
        Returns:
            int: 1 if net input > 0, else 0
        """
        return 1 if self.calculate_net_input(inputs) > 0 else 0
    
    def update(self, inputs, desired_output):
        """
        Update the weights and bias using Rosenblatt's learning rule.
        Only update when there is a misclassification.
        
        Args:
            inputs (list): The input values
            desired_output (int): The desired output (0 or 1)
            
        Returns:
            int: The error (-1, 0, or 1)
        """
        actual_output = self.predict(inputs)
        error = desired_output - actual_output
        
        # Only update weights if there is an error
        if error != 0:
            for i in range(len(self.weights)):
                self.weights[i] += self.learning_rate * error * inputs[i]
            self.bias += self.learning_rate * error
        
        return error 