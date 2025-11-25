import { workspace, Uri, window } from 'vscode';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename, extname } from 'path';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

export interface ClarContract {
  name: string;
  content: string;
  path: string;
}

export class TestGenerator {
  private openai: OpenAI | null = null;

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    // Load .env file from multiple possible locations
    const possibleEnvPaths = [];
    
    // 1. Current workspace folder
    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
      const workspacePath = workspace.workspaceFolders[0].uri.fsPath;
      possibleEnvPaths.push(join(workspacePath, '.env'));
    }
    
    // 2. Extension directory (where the .env file actually is)
    const extensionPath = __dirname;
    possibleEnvPaths.push(join(extensionPath, '.env'));
    possibleEnvPaths.push(join(extensionPath, '..', '.env'));
    
    // 3. User's home directory
    possibleEnvPaths.push(join(require('os').homedir(), '.env'));
    
    console.log('Looking for .env file in these locations:', possibleEnvPaths);
    
    let envLoaded = false;
    for (const envPath of possibleEnvPaths) {
      if (existsSync(envPath)) {
        dotenv.config({ path: envPath });
        console.log('✅ Loaded .env file from:', envPath);
        envLoaded = true;
        break;
      }
    }
    
    // Try environment variable first, then VS Code setting, then fallback
    const apiKey = process.env.OPENAI_API_KEY || 
                   workspace.getConfiguration('clarity').get('openaiApiKey') as string || 
                   "karanlodu";
    
    // Use custom base URL for your API
    const baseURL = 'https://gpt.adityaberry.me/v1';
    
    if (apiKey && apiKey.trim()) {
      this.openai = new OpenAI({
        baseURL: baseURL,
        apiKey: apiKey.trim()
      });
      console.log('✅ OpenAI initialized with custom base URL:', baseURL);
    } else {
      console.warn('OpenAI API key not found in environment variables or VS Code settings');
    }
  }

  async generateTests(): Promise<void> {
    // Try to reinitialize if not already initialized
    if (!this.openai) {
      console.log('OpenAI not initialized, attempting to reinitialize...');
      this.initializeOpenAI();
    }
    
    if (!this.openai) {
      window.showErrorMessage('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable or configure in VS Code settings.');
      return;
    }

    try {
      // Find all .clar files in the workspace
      const contracts = await this.findClarFiles();
      
      if (contracts.length === 0) {
        window.showWarningMessage('No .clar files found in the workspace.');
        return;
      }

      window.showInformationMessage(`Found ${contracts.length} contract(s). Generating tests...`);

      // Generate tests for each contract
      for (const contract of contracts) {
        await this.generateTestForContract(contract);
      }

      window.showInformationMessage('Test generation completed! Check the tests/ folder.');
    } catch (error) {
      console.error('Error generating tests:', error);
      window.showErrorMessage(`Failed to generate tests: ${error}`);
    }
  }

  private async findClarFiles(): Promise<ClarContract[]> {
    const contracts: ClarContract[] = [];
    
    if (!workspace.workspaceFolders) {
      console.log('No workspace folders found');
      return contracts;
    }

    const workspaceFolder = workspace.workspaceFolders[0];
    console.log('Searching for .clar files in workspace:', workspaceFolder.uri.fsPath);
    
    try {
      // Search for ALL .clar files recursively in the entire workspace
      const allClarFiles = await workspace.findFiles('**/*.clar');
      console.log(`Found ${allClarFiles.length} .clar files:`, allClarFiles.map(f => f.fsPath));
      
      for (const file of allClarFiles) {
        try {
          const content = readFileSync(file.fsPath, 'utf8');
          const contractName = basename(file.fsPath, '.clar');
          
          contracts.push({
            name: contractName,
            content,
            path: file.fsPath
          });
          
          console.log(`✅ Loaded contract: ${contractName} from ${file.fsPath}`);
        } catch (error) {
          console.error(`Error reading file ${file.fsPath}:`, error);
        }
      }
    } catch (error) {
      console.error('Error searching for .clar files:', error);
    }

    console.log(`Total contracts found: ${contracts.length}`);
    return contracts;
  }

  private async generateTestForContract(contract: ClarContract): Promise<void> {
    try {
      const testContent = await this.generateTestContent(contract);
      await this.saveTestFile(contract.name, testContent);
    } catch (error) {
      console.error(`Error generating test for ${contract.name}:`, error);
      window.showWarningMessage(`Failed to generate test for ${contract.name}`);
    }
  }

  private async generateTestContent(contract: ClarContract): Promise<string> {
    const prompt = this.createTestPrompt(contract);
    
    const response = await this.openai!.chat.completions.create({
      model: 'gpt-oss:120b',
      messages: [
        {
          role: 'system',
          content: `You are an expert Clarity smart contract developer and tester. Generate comprehensive test cases for Clarity contracts using the Clarinet testing framework.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  }

  private createTestPrompt(contract: ClarContract): string {
    return `Generate comprehensive test cases for this Clarity smart contract:

Contract Name: ${contract.name}
Contract Code:
\`\`\`clarity
${contract.content}
\`\`\`

Please generate test cases that cover:
1. All public functions with various input scenarios
2. Edge cases and error conditions
3. State changes and data validation
4. Access control and authorization
5. Integration scenarios

Use the Clarinet testing framework format with:
- \`clarinet test\` command structure
- Proper test descriptions
- Mock data and scenarios
- Assertions for expected outcomes
- Error case testing

use 

Format the output as a complete test file that can be saved as \`${contract.name}.test.ts\` in the tests/ folder.

Include imports, test setup, and comprehensive test coverage.`;
  }

  private async saveTestFile(contractName: string, testContent: string): Promise<void> {
    if (!workspace.workspaceFolders) {
      throw new Error('No workspace folder found');
    }

    const workspaceFolder = workspace.workspaceFolders[0];
    const testsPath = join(workspaceFolder.uri.fsPath, 'tests');
    
    // Create tests directory if it doesn't exist
    if (!existsSync(testsPath)) {
      mkdirSync(testsPath, { recursive: true });
    }

    const testFilePath = join(testsPath, `${contractName}.test.ts`);
    
    // Clean up the generated content
    const cleanedContent = this.cleanGeneratedContent(testContent);
    
    writeFileSync(testFilePath, cleanedContent, 'utf8');
    console.log(`Test file created: ${testFilePath}`);
  }

  private cleanGeneratedContent(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.replace(/```typescript\n?/g, '').replace(/```\n?/g, '');
    
    // Ensure proper imports
    if (!cleaned.includes('import { Clarinet')) {
      cleaned = `import { Clarinet, Tx, Chain, Account, types } from "https://deno.land/x/clarinet@v1.0.0/index.ts";

${cleaned}`;
    }

    // Ensure proper test structure
    if (!cleaned.includes('Clarinet.test')) {
      cleaned = `Clarinet.test({
  name: "Generated test suite",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    ${cleaned}
  },
});`;
    }

    return cleaned;
  }
}
