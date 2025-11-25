# Clarity Clean

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](./CHANGELOG.md)
[![VS Code](https://img.shields.io/badge/vscode-%3E%3D1.103.0-blue.svg)](https://code.visualstudio.com/)
[![Stacks](https://img.shields.io/badge/blockchain-Stacks-orange.svg)](https://www.stacks.co/)

**Clarity Clean** is a VS Code extension for developing smart contracts on the **Stacks blockchain** using the **Clarity** programming language. Build Stacks smart contracts faster with visual tools, intelligent code completion, and powerful development features.

## 🌐 Blockchain

This extension is designed specifically for the **Stacks blockchain**:
- **Clarity** is the smart contract language used by Stacks
- Supports deployment to Stacks networks: **Mainnet**, **Testnet**, **Devnet**, and **Local**
- Integrates with **Clarinet** (the official Stacks development tool)

> **What is Stacks?** Stacks is a Bitcoin Layer 2 blockchain that brings smart contracts and decentralized applications to Bitcoin. Learn more at [stacks.co](https://www.stacks.co/)

## ✨ Features

### 🎯 Core Features

- **📝 Intelligent Code Completion** - Auto-complete Clarity keywords, functions, and syntax with helpful documentation
- **🔍 Syntax Diagnostics** - Real-time error detection and validation for your Clarity code
- **🎨 Visual Block Editor** - Build contracts visually by dragging and dropping blocks (see [Block Editor Guide](./BLOCK-EDITOR-DEMO.md))
- **🤖 AI-Powered Test Generation** - Automatically generate comprehensive tests using OpenAI (requires API key - see [API Key Setup](./API-KEY-SETUP.md))
- **⚡ Clarinet Integration** - Seamless integration with Clarinet CLI for testing, deployment, and console access
- **📚 Rich Code Snippets** - Comprehensive snippets for common Clarity patterns and functions
- **🎨 Syntax Highlighting** - Full syntax highlighting for `.clar` files

### 🛠️ Command Palette Features

- **Generate Template** - Quickly scaffold new Clarity projects
- **Run Tests** - Generate and run AI-powered tests
- **Run Console** - Open interactive Clarinet REPL console
- **Test Functions** - Test individual functions with custom parameters
- **Generate Deployment** - Create deployment configurations for Mainnet/Testnet/Devnet/Local
- **Check Diagnostics** - Manually trigger syntax validation
- **Clear Diagnostics** - Clear all diagnostic messages

### 🎨 Visual Tools

- **Sidebar Commands** - Quick access to common commands via visual buttons
- **Block Editor** - Visual programming interface for building contracts
- **Code Generation** - Convert visual blocks to Clarity code

## 🌐 Supported Networks

The extension supports deployment and testing on all Stacks blockchain networks:

- **Mainnet** - Production Stacks blockchain
- **Testnet** - Public test network for development
- **Devnet** - Development network
- **Local** - Local development environment

You can generate deployment configurations for any of these networks using the "Generate Deployment" command.

## 📋 Requirements

- **Visual Studio Code** version 1.103.0 or higher
- **Clarinet** (optional but recommended) - Required for CLI commands
  - Install from: https://github.com/hirosystems/clarinet
  - The extension will check for Clarinet on startup
- **OpenAI API Key** (optional) - Required for AI-powered test generation
  - See [API Key Setup Guide](./API-KEY-SETUP.md) for configuration

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Clarity Clean"
4. Click Install

### Manual Installation

1. Clone or download this repository
2. Open the folder in VS Code
3. Press `F5` to run the extension in a new Extension Development Host window

### Install Clarinet (Optional but Recommended)

```bash
# macOS/Linux
npm install -g @hirosystems/clarinet

# Or using Homebrew (macOS)
brew install clarinet

# Verify installation
clarinet --version
```

## ⚙️ Extension Settings

This extension contributes the following settings:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `clarity.clarinetPath` | `string` | `"clarinet"` | Path to Clarinet executable (use full path if not in PATH) |
| `clarity.openaiApiKey` | `string` | `""` | OpenAI API Key for AI-powered test generation |

### How to Configure

1. Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
2. Search for "Clarity"
3. Configure the settings as needed

**Alternative**: Set `OPENAI_API_KEY` environment variable (see [API Key Setup](./API-KEY-SETUP.md))

## 📖 Usage

### Getting Started

1. **Open a Clarity Project**
   - Open a folder containing `.clar` files
   - Or create a new Clarinet project using "Generate Template"

2. **Access the Extension**
   - Click the Clarity icon in the Activity Bar (left sidebar)
   - You'll see two tabs:
     - **Commands** - Quick access to Clarinet commands
     - **Block Editor** - Visual contract builder

### Using Code Completion

1. Open any `.clar` file
2. Start typing Clarity keywords (e.g., `define-`, `if`, `map-`)
3. Press `Ctrl+Space` to trigger autocomplete
4. Select from the suggestions with helpful documentation

### Using the Block Editor

The Block Editor allows you to visually build Clarity contracts:

1. Click the **Clarity** icon in the Activity Bar
2. Select the **Block Editor** tab
3. Click on block types (Function, Constant, Map, etc.) to add them
4. Click **Generate Code** to convert blocks to Clarity code
5. See [Block Editor Demo](./BLOCK-EDITOR-DEMO.md) for detailed guide

### Running Commands

#### From Sidebar:
- Click the **Clarity** icon → **Commands** tab
- Click any command button to execute

#### From Command Palette:
- Press `Ctrl+Shift+P` / `Cmd+Shift+P`
- Type "Clarity:" to see all available commands

### Generating AI Tests

1. Configure your OpenAI API key (see [API Key Setup](./API-KEY-SETUP.md))
2. Open your Clarity project
3. Run the **"Clarity: Run Test"** command
4. The extension will analyze your contracts and generate comprehensive tests

### Testing Individual Functions

1. Run **"Clarity: Run Deploy"** (actually tests functions)
2. Select a function from the list
3. Enter parameter values when prompted
4. View results in the terminal

## 🎯 Code Snippets

The extension includes snippets for common Clarity patterns:

- `define-public` - Public function definition
- `define-private` - Private function definition
- `define-read-only` - Read-only function definition
- `define-map` - Map definition
- `try!` - Unwrap response/optional
- `unwrap!` - Unwrap with error handling
- `map-get?` - Get value from map
- `map-set` - Set value in map
- And many more...

Type the snippet prefix and press `Tab` to expand.

## 📁 Project Structure

When using the extension with a Clarinet project:

```
my-clarity-project/
├── contracts/
│   └── my-contract.clar
├── tests/
│   └── my-contract_test.ts
├── Clarinet.toml
└── deployments/
    └── default.devnet-plan.yaml
```

## 🐛 Known Issues

- **LSP Server**: The Language Server Protocol integration is temporarily disabled to prevent crashes. The extension uses alternative diagnostic methods for syntax checking.
- **Missing Command Handlers**: Some commands (`clarity.runCheck`, `clarity.runIntegrate`) are defined but handlers may need to be implemented.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Release Notes

See [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.

### Version 0.0.1

- Initial release of Clarity Clean
- Code completion for Clarity syntax
- Syntax diagnostics and error detection
- Visual Block Editor for contract building
- AI-powered test generation
- Clarinet CLI integration
- Comprehensive code snippets
- Syntax highlighting

## 📚 Additional Resources

- **[Block Editor Demo](./BLOCK-EDITOR-DEMO.md)** - Learn how to use the visual block editor
- **[API Key Setup](./API-KEY-SETUP.md)** - Configure OpenAI API key for test generation
- **[Clarity Documentation](https://docs.stacks.co/docs/clarity/)** - Official Clarity language docs
- **[Clarinet Documentation](https://github.com/hirosystems/clarinet)** - Clarinet CLI tool docs
- **[Stacks Blockchain](https://www.stacks.co/)** - Learn about the Stacks blockchain

## 🔗 Related Extensions

- **[Clarity LSP](https://marketplace.visualstudio.com/items?itemName=hirosystems.clarity-lsp)** - Official Clarity Language Server (dependency)

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Built for the Stacks and Clarity smart contract ecosystem
- Uses OpenAI API for intelligent test generation
- Integrates with Clarinet by Hiro Systems

---

**Enjoy building with Clarity!** 🚀

For issues, feature requests, or questions, please open an issue on the GitHub repository.
