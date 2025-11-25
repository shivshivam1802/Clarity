# Clarity Block Editor Demo

## Overview

The Clarity extension now includes a **Block Editor** tab in the sidebar that allows you to visually build Clarity contracts by dragging and dropping blocks.

## Features

### Two Tabs in Sidebar:
1. **Commands Tab** - Run Clarinet commands
2. **Block Editor Tab** - Visual code generation

### Available Block Types:

#### 1. **Function Block**
- **Purpose**: Define Clarity functions
- **Template**: `(define-public (function-name (param1 uint)) (ok true))`
- **Parameters**: Function name, parameters, return value

#### 2. **Constant Block**
- **Purpose**: Define constants
- **Template**: `(define-constant CONSTANT-NAME value)`
- **Parameters**: Constant name, value

#### 3. **Variable Block**
- **Purpose**: Define data variables
- **Template**: `(define-data-var variable-name type initial-value)`
- **Parameters**: Variable name, type, initial value

#### 4. **Map Block**
- **Purpose**: Define maps
- **Template**: `(define-map map-name key-type value-type)`
- **Parameters**: Map name, key type, value type

#### 5. **Condition Block**
- **Purpose**: If/When statements
- **Template**: `(if condition then-expression else-expression)`
- **Parameters**: Condition, then expression, else expression

#### 6. **Operation Block**
- **Purpose**: Arithmetic operations
- **Template**: `(+ value1 value2)`
- **Parameters**: Operator, value1, value2

## How to Use

### Step 1: Open Block Editor
1. Click the **Clarity icon** in the Activity Bar
2. Click the **"Block Editor"** tab
3. You'll see available block types and current blocks

### Step 2: Add Blocks
1. Click on any **block type** (Function, Constant, etc.)
2. A new block will be added to the "Current Blocks" section
3. Blocks are automatically numbered and can be expanded

### Step 3: Generate Code
1. Add multiple blocks as needed
2. Click **"Generate Code"** button
3. A new document will open with the generated Clarity code
4. The code will be properly formatted and ready to use

### Step 4: Clear and Restart
1. Click **"Clear All"** to remove all blocks
2. Start building a new contract

## Example Workflow

### Building a Simple Contract:

1. **Add Function Block** → Creates `(define-public (function-name (param1 uint)) (ok true))`
2. **Add Constant Block** → Creates `(define-constant CONSTANT-NAME value)`
3. **Add Map Block** → Creates `(define-map map-name key-type value-type)`
4. **Click Generate Code** → Opens new document with all blocks combined

### Generated Code Example:
```clarity
(define-public (function-name (param1 uint))
  (ok true)
)

(define-constant CONSTANT-NAME value)

(define-map map-name key-type value-type)
```

## Benefits

- **Visual Programming**: No need to remember Clarity syntax
- **Beginner Friendly**: Perfect for learning Clarity
- **Rapid Prototyping**: Quickly build contract structures
- **Code Generation**: Automatically generates proper Clarity code
- **Educational**: Learn Clarity patterns through visual blocks

## Tips

- **Start Simple**: Begin with basic blocks like constants and functions
- **Use Parameters**: Each block has customizable parameters
- **Generate Often**: Generate code frequently to see your progress
- **Clear and Rebuild**: Don't be afraid to clear and start over
- **Combine with Commands**: Use the Commands tab to test your generated code

## Integration with Commands

The Block Editor works seamlessly with the Commands tab:
1. **Generate code** in Block Editor
2. **Save the file** as `.clar`
3. **Switch to Commands tab**
4. **Run Check** to validate your generated code
5. **Run Test** to test your contract

This creates a complete visual-to-code-to-test workflow!
