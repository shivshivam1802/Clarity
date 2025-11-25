import { workspace, ExtensionContext, CompletionItemProvider, CompletionItem, CompletionItemKind, TextDocument, Position, CancellationToken, CompletionContext, SnippetString, MarkdownString, languages, window, commands, Terminal, env, Uri } from 'vscode';
import { readFileSync } from 'fs';
import { basename, join as pathJoin } from 'path';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';
import { ClarityCommandsProvider } from './clarityCommandsProvider';
import { ClarityBlockEditorProvider } from './clarityBlockEditorProvider';
import { ClarityDiagnosticProvider } from './clarityDiagnosticProvider';
import { TestGenerator } from './testGenerator';

let client: LanguageClient | undefined;

// Clarity autocompletion provider
class ClarityCompletionProvider implements CompletionItemProvider {
  provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext): CompletionItem[] {
    console.log('ClarityCompletionProvider: provideCompletionItems called');
    const completions: CompletionItem[] = [];
    
    // Get the current line text up to the cursor position
    const lineText = document.lineAt(position).text.substring(0, position.character);
    console.log('Current line text:', lineText);
    
    // Basic Clarity keywords and functions
    const clarityKeywords = [
      // Define statements
      { label: 'define-public', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(define-public (${1:function-name} (${2:param1} ${3:param-type}))\n  ${4:; body}\n)'), documentation: 'Define a public function' },
      { label: 'define-private', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(define-private (${1:function-name} (${2:param1} ${3:param-type}))\n  ${4:; body}\n)'), documentation: 'Define a private function' },
      { label: 'define-read-only', kind: CompletionItemKind.Keyword, insertText: new SnippetString('define-read-only (${1:function-name} (${2:param1} ${3:param-type}))\n  ${4:; body}\n)'), documentation: 'Define a read-only function' },
      { label: 'define-trait', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(define-trait ${1:trait-name}\n  (${2:function-name} (${3:param1} ${4:param-type}) ${5:return-type})\n)'), documentation: 'Define a trait' },
      { label: 'define-fungible-token', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(define-fungible-token ${1:token-name}'), documentation: 'Define a fungible token' },
      { label: 'define-non-fungible-token', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(define-non-fungible-token ${1:token-name}'), documentation: 'Define a non-fungible token' },
      
      // Constants and Variables
      { label: 'define-constant', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(define-constant ${1:CONSTANT-NAME} ${2:value})'), documentation: 'Define a constant value' },
      { label: 'define-map', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(define-map ${1:map-name} ${2:key-type} ${3:value-type})'), documentation: 'Define a map' },
      
      // Control flow
      { label: 'if', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(if ${1:condition}\n  ${2:then-expression}\n  ${3:else-expression}\n)'), documentation: 'Conditional expression' },
      { label: 'when', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(when ${1:condition}\n  ${2:then-expression}\n)'), documentation: 'Conditional expression without else' },
      { label: 'match', kind: CompletionItemKind.Keyword, insertText: new SnippetString('(match ${1:value}\n  ${2:pattern1} ${3:expression1}\n  ${4:pattern2} ${5:expression2}\n)'), documentation: 'Pattern matching' },
      
      // Loops and iteration
      { label: 'map', kind: CompletionItemKind.Function, insertText: new SnippetString('(map ${1:function} ${2:list})'), documentation: 'Apply function to each element in list' },
      { label: 'filter', kind: CompletionItemKind.Function, insertText: new SnippetString('(filter ${1:function} ${2:list})'), documentation: 'Filter list based on predicate' },
      { label: 'fold', kind: CompletionItemKind.Function, insertText: new SnippetString('(fold ${1:function} ${2:initial} ${3:list})'), documentation: 'Reduce list to single value' },
      
      // Arithmetic operations
      { label: '+', kind: CompletionItemKind.Operator, insertText: new SnippetString('(+ ${1:num1} ${2:num2})'), documentation: 'Addition' },
      { label: '-', kind: CompletionItemKind.Operator, insertText: new SnippetString('(- ${1:num1} ${2:num2})'), documentation: 'Subtraction' },
      { label: '*', kind: CompletionItemKind.Operator, insertText: new SnippetString('(* ${1:num1} ${2:num2})'), documentation: 'Multiplication' },
      { label: '/', kind: CompletionItemKind.Operator, insertText: new SnippetString('(/ ${1:num1} ${2:num2})'), documentation: 'Division' },
      { label: 'mod', kind: CompletionItemKind.Operator, insertText: new SnippetString('(mod ${1:num1} ${2:num2})'), documentation: 'Modulo' },
      { label: 'pow', kind: CompletionItemKind.Operator, insertText: new SnippetString('(pow ${1:base} ${2:exponent})'), documentation: 'Power' },
      
      // Comparison operations
      { label: '=', kind: CompletionItemKind.Operator, insertText: new SnippetString('(= ${1:val1} ${2:val2})'), documentation: 'Equality' },
      { label: '!=', kind: CompletionItemKind.Operator, insertText: new SnippetString('(!= ${1:val1} ${2:val2})'), documentation: 'Inequality' },
      { label: '<', kind: CompletionItemKind.Operator, insertText: new SnippetString('(< ${1:val1} ${2:val2})'), documentation: 'Less than' },
      { label: '<=', kind: CompletionItemKind.Operator, insertText: new SnippetString('(<= ${1:val1} ${2:val2})'), documentation: 'Less than or equal' },
      { label: '>', kind: CompletionItemKind.Operator, insertText: new SnippetString('(> ${1:val1} ${2:val2})'), documentation: 'Greater than' },
      { label: '>=', kind: CompletionItemKind.Operator, insertText: new SnippetString('(>= ${1:val1} ${2:val2})'), documentation: 'Greater than or equal' },
      
      // Boolean operations
      { label: 'and', kind: CompletionItemKind.Operator, insertText: new SnippetString('(and ${1:expr1} ${2:expr2})'), documentation: 'Logical AND' },
      { label: 'or', kind: CompletionItemKind.Operator, insertText: new SnippetString('(or ${1:expr1} ${2:expr2})'), documentation: 'Logical OR' },
      { label: 'not', kind: CompletionItemKind.Operator, insertText: new SnippetString('(not ${1:expression})'), documentation: 'Logical NOT' },
      
      // String operations
      { label: 'concat', kind: CompletionItemKind.Function, insertText: new SnippetString('(concat ${1:string1} ${2:string2})'), documentation: 'Concatenate strings' },
      { label: 'str-len', kind: CompletionItemKind.Function, insertText: new SnippetString('(str-len ${1:string})'), documentation: 'Get string length' },
      { label: 'str-to-int', kind: CompletionItemKind.Function, insertText: new SnippetString('(str-to-int ${1:string})'), documentation: 'Convert string to integer' },
      { label: 'int-to-str', kind: CompletionItemKind.Function, insertText: new SnippetString('(int-to-str ${1:integer})'), documentation: 'Convert integer to string' },
      
      // List operations
      { label: 'list', kind: CompletionItemKind.Function, insertText: new SnippetString('(list ${1:item1} ${2:item2})'), documentation: 'Create a list' },
      { label: 'len', kind: CompletionItemKind.Function, insertText: new SnippetString('(len ${1:list})'), documentation: 'Get list length' },
      { label: 'append', kind: CompletionItemKind.Function, insertText: new SnippetString('(append ${1:list} ${2:item})'), documentation: 'Append item to list' },
      { label: 'concat', kind: CompletionItemKind.Function, insertText: new SnippetString('(concat ${1:list1} ${2:list2})'), documentation: 'Concatenate lists' },
      
      // Data types
      { label: 'ok', kind: CompletionItemKind.Value, insertText: 'ok', documentation: 'Ok response type' },
      { label: 'err', kind: CompletionItemKind.Value, insertText: new SnippetString('(err ${1:error-code})'), documentation: 'Error response type' },
      { label: 'some', kind: CompletionItemKind.Value, insertText: new SnippetString('(some ${1:value})'), documentation: 'Some optional value' },
      { label: 'none', kind: CompletionItemKind.Value, insertText: 'none', documentation: 'None optional value' },
      
      // Clarity-specific functions
      { label: 'print', kind: CompletionItemKind.Function, insertText: new SnippetString('(print ${1:value})'), documentation: 'Print value to console/emit event' },
      
      // Unwrapping functions
      { label: 'try!', kind: CompletionItemKind.Function, insertText: new SnippetString('(try! ${1:optional-or-response})'), documentation: 'Unwrap optional or response, exit on none/err' },
      { label: 'unwrap!', kind: CompletionItemKind.Function, insertText: new SnippetString('(unwrap! ${1:optional-value} ${2:error-value})'), documentation: 'Unwrap optional value or return error' },
      { label: 'unwrap-panic', kind: CompletionItemKind.Function, insertText: new SnippetString('(unwrap-panic ${1:optional-value})'), documentation: 'Unwrap optional value or panic' },
      { label: 'unwrap-err!', kind: CompletionItemKind.Function, insertText: new SnippetString('(unwrap-err! ${1:response-value} ${2:error-value})'), documentation: 'Unwrap response value or return error' },
      { label: 'unwrap-err-panic', kind: CompletionItemKind.Function, insertText: new SnippetString('(unwrap-err-panic ${1:response-value})'), documentation: 'Unwrap response value or panic' },
      
      // Type checking functions
      { label: 'is-ok', kind: CompletionItemKind.Function, insertText: new SnippetString('(is-ok ${1:response-value})'), documentation: 'Check if response is ok' },
      { label: 'is-err', kind: CompletionItemKind.Function, insertText: new SnippetString('(is-err ${1:response-value})'), documentation: 'Check if response is error' },
      { label: 'is-some', kind: CompletionItemKind.Function, insertText: new SnippetString('(is-some ${1:optional-value})'), documentation: 'Check if optional has value' },
      { label: 'is-none', kind: CompletionItemKind.Function, insertText: new SnippetString('(is-none ${1:optional-value})'), documentation: 'Check if optional is none' },
      
      // Tuple and struct operations
      { label: 'merge', kind: CompletionItemKind.Function, insertText: new SnippetString('(merge ${1:tuple1} ${2:tuple2})'), documentation: 'Merge two tuples, second overwrites first' },
      { label: 'get', kind: CompletionItemKind.Function, insertText: new SnippetString('(get ${1:field-name} ${2:tuple})'), documentation: 'Get field value from tuple' },
      { label: 'is-eq', kind: CompletionItemKind.Function, insertText: new SnippetString('(is-eq ${1:value1} ${2:value2})'), documentation: 'Check if two values are equal' },
      { label: 'asserts!', kind: CompletionItemKind.Function, insertText: new SnippetString('(asserts! ${1:condition} ${2:error-code})'), documentation: 'Assert condition or return error' },
      
      // String operations
      { label: 'string-ascii', kind: CompletionItemKind.Keyword, insertText: 'string-ascii', documentation: 'ASCII string type' },
      { label: 'string-utf8', kind: CompletionItemKind.Keyword, insertText: 'string-utf8', documentation: 'UTF-8 string type' },
      { label: 'concat', kind: CompletionItemKind.Function, insertText: new SnippetString('(concat ${1:string1} ${2:string2})'), documentation: 'Concatenate strings' },
      { label: 'str-len', kind: CompletionItemKind.Function, insertText: new SnippetString('(str-len ${1:string})'), documentation: 'Get string length' },
      { label: 'str-to-int', kind: CompletionItemKind.Function, insertText: new SnippetString('(str-to-int ${1:string})'), documentation: 'Convert string to integer' },
      { label: 'int-to-str', kind: CompletionItemKind.Function, insertText: new SnippetString('(int-to-str ${1:integer})'), documentation: 'Convert integer to string' },
      
      // STX and token operations
      { label: 'stx-transfer?', kind: CompletionItemKind.Function, insertText: new SnippetString('(stx-transfer? ${1:amount} ${2:sender} ${3:recipient})'), documentation: 'Transfer STX tokens (returns response)' },
      { label: 'stx-get-balance', kind: CompletionItemKind.Function, insertText: new SnippetString('(stx-get-balance ${1:account})'), documentation: 'Get STX balance of account' },
      { label: 'as-contract', kind: CompletionItemKind.Function, insertText: new SnippetString('(as-contract ${1:expression})'), documentation: 'Execute expression as contract' },
      { label: 'contract-caller', kind: CompletionItemKind.Function, insertText: 'contract-caller', documentation: 'Get contract caller principal' },
      { label: 'tx-sender', kind: CompletionItemKind.Function, insertText: 'tx-sender', documentation: 'Get transaction sender principal' },
      
      // Response checking patterns
      { label: 'default-to', kind: CompletionItemKind.Function, insertText: new SnippetString('(default-to ${1:default-value} ${2:optional-value})'), documentation: 'Get value from optional or return default' },
      { label: 'expects!', kind: CompletionItemKind.Function, insertText: new SnippetString('(expects! ${1:optional-value} ${2:error-code})'), documentation: 'Expect optional to have value or return error' },
      { label: 'expects-err!', kind: CompletionItemKind.Function, insertText: new SnippetString('(expects-err! ${1:response-value} ${2:error-code})'), documentation: 'Expect response to be error or return error' },
      
      // Map operations
      { label: 'map-get', kind: CompletionItemKind.Function, insertText: new SnippetString('(map-get? ${1:map-name} ${2:key})'), documentation: 'Get value from map (returns optional)' },
      { label: 'map-set', kind: CompletionItemKind.Function, insertText: new SnippetString('(map-set ${1:map-name} ${2:key} ${3:value})'), documentation: 'Set value in map (overwrites existing)' },
      { label: 'map-insert', kind: CompletionItemKind.Function, insertText: new SnippetString('(map-insert ${1:map-name} ${2:key} ${3:value})'), documentation: 'Insert value in map (fails if key exists)' },
      { label: 'map-delete', kind: CompletionItemKind.Function, insertText: new SnippetString('(map-delete ${1:map-name} ${2:key})'), documentation: 'Delete key from map' },
      { label: 'map-insert!', kind: CompletionItemKind.Function, insertText: new SnippetString('(map-insert! ${1:map-name} ${2:key} ${3:value})'), documentation: 'Insert value in map (panics if key exists)' },
      { label: 'map-set!', kind: CompletionItemKind.Function, insertText: new SnippetString('(map-set! ${1:map-name} ${2:key} ${3:value})'), documentation: 'Set value in map (panics if key does not exist)' },
      
      // Comments
      { label: 'comment', kind: CompletionItemKind.Snippet, insertText: new SnippetString(';; ${1:comment}'), documentation: 'Add a comment' }
    ];
    
    // Add all completions
    clarityKeywords.forEach(keyword => {
      const item = new CompletionItem(keyword.label, keyword.kind);
      item.insertText = keyword.insertText;
      item.documentation = new MarkdownString(keyword.documentation);
      completions.push(item);
    });
    
    return completions;
  }
}

// Helper function to check if Clarinet is available
async function isClarinetAvailable(): Promise<boolean> {
  try {
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('clarinet --version', (error: any) => {
        resolve(!error);
      });
    });
  } catch {
    return false;
  }
}

export async function activate(context: ExtensionContext) {
  // Temporarily disable LSP server to prevent crashes
  // TODO: Re-enable LSP server once Clarinet LSP is stable
  console.log('Clarity LSP server is temporarily disabled to prevent crashes');
  
  // Check if Clarinet is available for CLI commands
  const clarinetAvailable = await isClarinetAvailable();
  
  if (!clarinetAvailable) {
    console.warn('Clarinet is not available. CLI commands will not work.');
    window.showWarningMessage('Clarinet is not installed or not in PATH. CLI commands will not work. Install Clarinet for full functionality.');
  } else {
    console.log('Clarinet is available. CLI commands will work.');
  }
  
  // Register the completion provider
  console.log('Registering Clarity completion provider');
  const completionProvider = new ClarityCompletionProvider();
  const disposable = languages.registerCompletionItemProvider('clarity', completionProvider);
  context.subscriptions.push(disposable);
  console.log('Clarity completion provider registered');
  
  // Register the diagnostic provider for syntax error detection
  console.log('Registering Clarity diagnostic provider');
  const diagnosticProvider = new ClarityDiagnosticProvider();
  diagnosticProvider.activate(context);
  context.subscriptions.push(diagnosticProvider);
  
  // Register command to clear diagnostics
  const clearDiagnosticsCommand = commands.registerCommand('clarity.clearDiagnostics', () => {
    const activeEditor = window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'clarity') {
      diagnosticProvider.clearDiagnostics(activeEditor.document);
      window.showInformationMessage('Clarity diagnostics cleared');
    }
  });
  context.subscriptions.push(clearDiagnosticsCommand);
  
  // Register command to manually check diagnostics
  const checkDiagnosticsCommand = commands.registerCommand('clarity.checkDiagnostics', () => {
    const activeEditor = window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'clarity') {
      // Access the private method through any
      (diagnosticProvider as any).checkSyntax(activeEditor.document);
      window.showInformationMessage('Clarity diagnostics checked');
    }
  });
  context.subscriptions.push(checkDiagnosticsCommand);
  
  console.log('Clarity diagnostic provider registered');
  
  // Register the sidebar tree view providers
  console.log('Registering Clarity sidebar');
  const clarityCommandsProvider = new ClarityCommandsProvider();
  const clarityBlockEditorProvider = new ClarityBlockEditorProvider();
  
  window.registerTreeDataProvider('clarityCommands', clarityCommandsProvider);
  window.registerTreeDataProvider('clarityBlockEditor', clarityBlockEditorProvider);
  
  context.subscriptions.push(commands.registerCommand('clarity.refreshCommands', () => clarityCommandsProvider.refresh()));
  console.log('Clarity sidebar registered');
  
  // Register command handlers for Clarinet commands
  context.subscriptions.push(commands.registerCommand('clarity.generateTemplate', () => runClarinetCommand('clarinet new ./smart-contract')));
  context.subscriptions.push(commands.registerCommand('clarity.runTest', () => generateAITests()));
  context.subscriptions.push(commands.registerCommand('clarity.runConsole', () => runClarinetCommand('clarinet console')));
  context.subscriptions.push(commands.registerCommand('clarity.generateDeployment', () => generateDeployment()));
  context.subscriptions.push(commands.registerCommand('clarity.runDeploy', () => testIndividualFunctions()));
  
  // Register block editor commands
  context.subscriptions.push(commands.registerCommand('clarity.addBlock', (type: string) => clarityBlockEditorProvider.addBlock(type)));
  context.subscriptions.push(commands.registerCommand('clarity.generateCode', () => generateCodeFromBlocks(clarityBlockEditorProvider)));
  context.subscriptions.push(commands.registerCommand('clarity.clearBlocks', () => clarityBlockEditorProvider.clearBlocks()));
  context.subscriptions.push(commands.registerCommand('clarity.openBlockEditor', () => openBlockEditor()));
  
  console.log('Clarity commands registered');
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    console.log('No LSP client to stop');
    return undefined;
  }
  console.log('Stopping LSP client');
  return client.stop();
}

// Helper function to run Clarinet commands
async function runClarinetCommand(cmd: string) {
  // Check if a workspace is open (Clarinet expects a project folder)
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    window.showErrorMessage('Open a Clarity project folder first.');
    return;
  }

  // Get Clarinet path from settings
  const clarinetPath = workspace.getConfiguration('clarity').get('clarinetPath') as string;
  const fullCommand = cmd.replace('clarinet', clarinetPath);

  // Create or reuse a terminal
  const terminalName = 'Clarity Commands';
  let terminal = window.terminals.find(t => t.name === terminalName);
  if (!terminal) {
    terminal = window.createTerminal(terminalName);
  }
  terminal.show();

  // Change to the project directory and run the command
  const projectPath = workspace.workspaceFolders[0].uri.fsPath;
  terminal.sendText(`cd "${projectPath}"`);
  terminal.sendText(fullCommand);
  
  // Show a message to the user
  window.showInformationMessage(`Running: ${fullCommand}`);
}

// Helper function to run Clarinet commands with input
async function runClarinetCommandWithInput(cmd: string, inputCommand: string) {
  // Check if a workspace is open (Clarinet expects a project folder)
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    window.showErrorMessage('Open a Clarity project folder first.');
    return;
  }

  // Get Clarinet path from settings
  const clarinetPath = workspace.getConfiguration('clarity').get('clarinetPath') as string;
  const fullCommand = cmd.replace('clarinet', clarinetPath);

  // Create or reuse a terminal
  const terminalName = 'Clarity Console';
  let terminal = window.terminals.find(t => t.name === terminalName);
  if (!terminal) {
    terminal = window.createTerminal(terminalName);
  }
  terminal.show();

  // Change to the project directory and run the command
  const projectPath = workspace.workspaceFolders[0].uri.fsPath;
  
  // Send commands with proper timing
  terminal.sendText(`cd "${projectPath}" && ${fullCommand}`);
  
  // Wait for the console to start, then send the input commands
  setTimeout(() => {
    if (terminal) {
      console.log('Sending commands to terminal:', inputCommand);
      
      // Split commands by newlines and send them with delays
      const commands = inputCommand.split('\n').filter(cmd => cmd.trim());
      
      commands.forEach((command, index) => {
        setTimeout(() => {
          if (terminal) {
            console.log(`Sending command ${index + 1}:`, command);
            terminal.sendText(command);
            terminal.sendText('\r');
          }
        }, index * 2000); // 2 second delay between commands
      });
    }
  }, 5000);
}

// Helper function to generate code from blocks
async function generateCodeFromBlocks(blockEditorProvider: ClarityBlockEditorProvider) {
  const generatedCode = blockEditorProvider.generateCode();
  
  if (!generatedCode.trim()) {
    window.showWarningMessage('No blocks to generate code from. Add some blocks first!');
    return;
  }

  // Show the generated code in a new document
  const doc = await workspace.openTextDocument({
    content: generatedCode,
    language: 'clarity'
  });
  
  await window.showTextDocument(doc);
  window.showInformationMessage('Generated Clarity code opened in new document!');
}

// Helper function to open block editor
function openBlockEditor() {
  // Focus on the block editor view
  commands.executeCommand('workbench.view.extension.clarity-sidebar');
  commands.executeCommand('workbench.view.extension.clarityBlockEditor');
  window.showInformationMessage('Block Editor opened! Drag and drop blocks to build your Clarity contract.');
}

// Helper function to generate AI-powered tests
async function generateAITests() {
  try {
    const testGenerator = new TestGenerator();
    await testGenerator.generateTests();
  } catch (error) {
    console.error('Error generating AI tests:', error);
    window.showErrorMessage(`Failed to generate AI tests: ${error}`);
  }
}

// Helper function to generate Clarinet deployment
async function generateDeployment() {
  // Check if a workspace is open
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    window.showErrorMessage('Open a Clarity project folder first.');
    return;
  }

  // Show network selection dialog
  const networks = [
    { label: 'Mainnet', value: 'mainnet' },
    { label: 'Testnet', value: 'testnet' },
    { label: 'Devnet', value: 'devnet' },
    { label: 'Local', value: 'local' }
  ];

  const selectedNetwork = await window.showQuickPick(networks, {
    placeHolder: 'Select network for deployment generation',
    title: 'Generate Clarinet Deployment'
  });

  if (!selectedNetwork) {
    return;
  }

  // Run the deployment generation command
  const command = `clarinet deployments generate --${selectedNetwork.value}`;
  await runClarinetCommand(command);
}

// Helper function to test individual functions
async function testIndividualFunctions() {
  // Check if a workspace is open
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    window.showErrorMessage('Open a Clarity project folder first.');
    return;
  }

  try {
    // Find all .clar files
    const clarFiles = await workspace.findFiles('**/*.clar');
    
    if (clarFiles.length === 0) {
      window.showWarningMessage('No .clar files found in the workspace.');
      return;
    }

    // Parse functions from all .clar files
    const allFunctions: FunctionInfo[] = [];
    
    for (const file of clarFiles) {
      const content = readFileSync(file.fsPath, 'utf8');
      const functions = parseClarityFunctions(content, file.fsPath);
      allFunctions.push(...functions);
    }

    if (allFunctions.length === 0) {
      window.showWarningMessage('No functions found in .clar files.');
      return;
    }

    // Show function selection
    const functionItems = allFunctions.map(func => ({
      label: func.name,
      description: `${func.contractName} - ${func.type} (${func.parameters.length} params)`,
      detail: func.signature,
      function: func
    }));

    const selectedFunction = await window.showQuickPick(functionItems, {
      placeHolder: 'Select a function to test',
      title: 'Test Individual Function'
    });

    if (!selectedFunction) {
      return;
    }

    // Test the selected function
    await testFunction(selectedFunction.function);

  } catch (error) {
    console.error('Error testing functions:', error);
    window.showErrorMessage(`Failed to test functions: ${error}`);
  }
}

// Interface for function information
interface FunctionInfo {
  name: string;
  type: 'public' | 'private' | 'read-only';
  contractName: string;
  parameters: ParameterInfo[];
  signature: string;
  filePath: string;
}

interface ParameterInfo {
  name: string;
  type: string;
}

// Parse Clarity functions from file content
function parseClarityFunctions(content: string, filePath: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  const contractName = basename(filePath, '.clar');
  
  // Regex patterns for different function types
  const patterns = [
    {
      type: 'public' as const,
      regex: /\(define-public\s+\(([^\s)]+)\s+([^)]+)\)/g
    },
    {
      type: 'private' as const,
      regex: /\(define-private\s+\(([^\s)]+)\s+([^)]+)\)/g
    },
    {
      type: 'read-only' as const,
      regex: /\(define-read-only\s+\(([^\s)]+)\s+([^)]+)\)/g
    }
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      const functionName = match[1].trim();
      const parametersStr = match[2].trim();
      
      // Parse parameters
      const parameters = parseParameters(parametersStr);
      
      // Create signature
      const signature = `(${functionName} ${parametersStr})`;
      
      functions.push({
        name: functionName,
        type: pattern.type,
        contractName,
        parameters,
        signature,
        filePath
      });
    }
  }

  return functions;
}

// Parse function parameters
function parseParameters(parametersStr: string): ParameterInfo[] {
  console.log('Parsing parameters from:', parametersStr);
  
  if (!parametersStr || parametersStr === '()') {
    return [];
  }

  const parameters: ParameterInfo[] = [];
  
  // Handle parameters in format: (amount uint) or (from principal) (amount uint)
  // First try to match individual parameter groups like (amount uint)
  const paramMatches = parametersStr.match(/\(([^)]+)\s+([^)]+)\)/g);
  console.log('Param matches:', paramMatches);
  
  if (paramMatches) {
    for (const match of paramMatches) {
      const paramContent = match.slice(1, -1); // Remove outer parentheses
      const parts = paramContent.split(/\s+/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const type = parts.slice(1).join(' ').trim(); // Join remaining parts as type
        parameters.push({ name, type });
        console.log('Parsed parameter:', { name, type });
      }
    }
  } else {
    // Handle single parameter without parentheses like: amount uint
    const singleParamMatch = parametersStr.match(/^(\w+)\s+(\w+)$/);
    if (singleParamMatch) {
      const name = singleParamMatch[1].trim();
      const type = singleParamMatch[2].trim();
      parameters.push({ name, type });
      console.log('Parsed single parameter:', { name, type });
    } else {
      // Fallback for simple parameters
      const paramPairs = parametersStr.match(/(\w+)\s+(\w+)/g);
      console.log('Simple param pairs:', paramPairs);
      if (paramPairs) {
        for (const pair of paramPairs) {
          const [name, type] = pair.split(/\s+/);
          parameters.push({ name: name.trim(), type: type.trim() });
          console.log('Parsed simple parameter:', { name, type });
        }
      }
    }
  }

  console.log('Final parameters:', parameters);
  return parameters;
}

// Test a specific function
async function testFunction(func: FunctionInfo) {
  try {
    console.log('Testing function:', func);
    
    // Show parameter input dialog
    const parameterValues = await getParameterValues(func);
    
    if (parameterValues === undefined) {
      return; // User cancelled
    }

    console.log('Parameter values:', parameterValues);

    // Read the original file to get the complete function definition
    const originalFile = await workspace.openTextDocument(func.filePath);
    const fileContent = originalFile.getText();
    
    // Extract the complete function definition
    const functionCode = extractFunctionDefinition(fileContent, func);
    
    if (!functionCode) {
      window.showErrorMessage(`Could not find function definition for ${func.name}`);
      return;
    }

    // Create a temporary .clar file with the function in the contracts directory
    const contractsDir = pathJoin(workspace.workspaceFolders![0].uri.fsPath, 'contracts');
    const tempFileName = `temp_test_${func.name}_${Date.now()}`;
    const tempFilePath = pathJoin(contractsDir, `${tempFileName}.clar`);
    const tempFileContent = createTempClarityFile(functionCode, func, parameterValues);
    
    // Ensure contracts directory exists
    try {
      await workspace.fs.createDirectory(Uri.file(contractsDir));
    } catch (error) {
      // Directory might already exist, ignore error
    }
    
    await workspace.fs.writeFile(Uri.file(tempFilePath), Buffer.from(tempFileContent, 'utf8'));
    console.log('Created temporary file:', tempFilePath);

    // Execute the function definition first, then the test call
    console.log('Executing function definition and test call...');
    const functionDefinition = functionCode.trim();
    const testCall = `(${func.name}${parameterValues.length > 0 ? ` ${parameterValues.join(' ')}` : ''})`;
    
    // Send function definition first and wait for it to complete
    await sendToClarinetConsole(functionDefinition);
    
    // Wait for the function definition to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Then send the test call
    await sendToClarinetConsole(testCall);
    
    // Clean up the temporary file after a delay
    setTimeout(async () => {
      try {
        await workspace.fs.delete(Uri.file(tempFilePath));
        console.log('Cleaned up temporary file:', tempFilePath);
      } catch (error) {
        console.error('Error cleaning up temporary file:', error);
      }
    }, 5000);
    
  } catch (error) {
    console.error('Error testing function:', error);
    window.showErrorMessage(`Failed to test function: ${error}`);
  }
}

// Get parameter values from user
async function getParameterValues(func: FunctionInfo): Promise<string[] | undefined> {
  console.log('Getting parameter values for function:', func.name);
  console.log('Function parameters:', func.parameters);
  
  if (func.parameters.length === 0) {
    // No parameters, just run the function
    console.log('No parameters found');
    return [];
  }

  const parameterValues: string[] = [];
  
  for (let i = 0; i < func.parameters.length; i++) {
    const param = func.parameters[i];
    console.log(`Getting value for parameter ${i + 1}/${func.parameters.length}:`, param);
    
    const value = await window.showInputBox({
      prompt: `Enter value for parameter ${i + 1}/${func.parameters.length}: ${param.name} (${param.type})`,
      placeHolder: `e.g., ${getExampleValue(param.type)}`,
      validateInput: (value) => validateParameterValue(value, param.type)
    });

    if (value === undefined) {
      return undefined; // User cancelled
    }

    parameterValues.push(value);
    console.log(`Added parameter value: ${value}`);
  }

  console.log('All parameter values:', parameterValues);
  return parameterValues;
}

// Get example value for parameter type
function getExampleValue(type: string): string {
  const examples: { [key: string]: string } = {
    'uint': 'u100',
    'int': 'i100',
    'bool': 'true',
    'string-ascii': '"hello"',
    'string-utf8': 'u"hello"',
    'principal': 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    'list': '(list u1 u2 u3)',
    'tuple': '(tuple (key "value"))',
    'optional': '(some u100)',
    'response': '(ok u100)'
  };

  return examples[type] || 'value';
}

// Validate parameter value
function validateParameterValue(value: string, type: string): string | undefined {
  if (!value.trim()) {
    return 'Parameter value cannot be empty';
  }

  // Basic validation based on type
  switch (type) {
    case 'uint':
      if (!value.match(/^u\d+$/)) {
        return 'Invalid uint format. Use: u123';
      }
      break;
    case 'int':
      if (!value.match(/^i-?\d+$/)) {
        return 'Invalid int format. Use: i123 or i-123';
      }
      break;
    case 'bool':
      if (!['true', 'false'].includes(value)) {
        return 'Invalid bool format. Use: true or false';
      }
      break;
    case 'string-ascii':
      if (!value.startsWith('"') || !value.endsWith('"')) {
        return 'Invalid string-ascii format. Use: "hello"';
      }
      break;
    case 'string-utf8':
      if (!value.startsWith('u"') || !value.endsWith('"')) {
        return 'Invalid string-utf8 format. Use: u"hello"';
      }
      break;
  }

  return undefined;
}

// Create test command for the function
function createTestCommand(func: FunctionInfo, parameterValues: string[]): string {
  const paramStr = parameterValues.length > 0 ? ` ${parameterValues.join(' ')}` : '';
  // Use the correct Clarinet console syntax with dot notation
  return `(contract-call? .${func.contractName} ${func.name}${paramStr})`;
}

// Helper function to get alternative command formats
function getAlternativeCommands(func: FunctionInfo, parameterValues: string[]): string[] {
  const paramStr = parameterValues.length > 0 ? ` ${parameterValues.join(' ')}` : '';
  return [
    `(contract-call? .${func.contractName} ${func.name}${paramStr})`,
    `(${func.name}${paramStr})`,
    `(contract-call? '${func.contractName} ${func.name}${paramStr})`,
    `(contract-call? .${func.contractName.toLowerCase()} ${func.name}${paramStr})`,
    `(contract-call? .${func.contractName.toUpperCase()} ${func.name}${paramStr})`
  ];
}

// Extract complete function definition from file content
function extractFunctionDefinition(fileContent: string, func: FunctionInfo): string | null {
  const lines = fileContent.split('\n');
  let inFunction = false;
  let braceCount = 0;
  let functionLines: string[] = [];
  let startLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for function definition start
    if (!inFunction) {
      const functionPattern = new RegExp(`\\(define-(public|private|read-only)\\s+\\(${func.name}\\s+`);
      if (functionPattern.test(line)) {
        inFunction = true;
        startLine = i;
        functionLines.push(line);
        // Count opening braces in this line
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        continue;
      }
    }
    
    if (inFunction) {
      functionLines.push(line);
      // Count braces to find the end of the function
      braceCount += (line.match(/\{/g) || []).length;
      braceCount -= (line.match(/\}/g) || []).length;
      
      // If we've closed all braces, we've found the end
      if (braceCount === 0) {
        break;
      }
    }
  }

  return inFunction ? functionLines.join('\n') : null;
}

// Send command directly to existing Clarinet console
async function sendToClarinetConsole(command: string) {
  const terminalName = 'Clarity Console';
  let terminal = window.terminals.find(t => t.name === terminalName);
  
  if (!terminal) {
    // Start Clarinet console if it doesn't exist
    console.log('Starting Clarinet console...');
    terminal = window.createTerminal(terminalName);
    
    // Check if a workspace is open
    if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
      window.showErrorMessage('Open a Clarity project folder first.');
      return;
    }
    
    // Get Clarinet path from settings
    const clarinetPath = workspace.getConfiguration('clarity').get('clarinetPath') as string;
    const projectPath = workspace.workspaceFolders[0].uri.fsPath;
    
    // Start the console
    terminal.sendText(`cd "${projectPath}" && ${clarinetPath} console`);
    terminal.show();
    
    // Wait for console to start before sending commands
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  terminal.show();
  console.log('Sending command to console:', command);
  terminal.sendText(command);
  terminal.sendText('\r');
}

// Create temporary Clarity file content
function createTempClarityFile(functionCode: string, func: FunctionInfo, parameterValues: string[]): string {
  const paramStr = parameterValues.length > 0 ? ` ${parameterValues.join(' ')}` : '';
  const testCall = `(${func.name}${paramStr})`;
  
  // Return just the test call - the function should already be defined in the console
  return testCall;
}