import { TreeDataProvider, TreeItem, TreeItemCollapsibleState, Command, ProviderResult, EventEmitter, Event, ThemeIcon } from 'vscode';

export class ClarityCommandsProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> = new EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    if (element) {
      return [];  // No children, flat list
    }
    
    // Root items: Your "buttons"
    return [
      this.createCommandItem('Generate Template', 'clarity.generateTemplate', 'Generates a template for a new contract', 'terminal'),
      this.createCommandItem('Generate Tests', 'clarity.runTest', 'Runs contract tests', 'beaker'),
      this.createCommandItem('Run Console', 'clarity.runConsole', 'Opens interactive REPL', 'terminal'),
      this.createCommandItem('Test Functions', 'clarity.runDeploy', 'Test individual functions with parameters', 'beaker'),
      this.createCommandItem('Generate Deployment', 'clarity.generateDeployment', 'Generates deployment configuration for specific network', 'gear'),
      this.createSeparatorItem(),
      this.createInfoItem('Clarity Commands', 'Click any command to run it in the terminal')
    ];
  }

  private createCommandItem(label: string, commandId: string, tooltip: string, icon: string): TreeItem {
    const treeItem = new TreeItem(label, TreeItemCollapsibleState.None);
    treeItem.tooltip = tooltip;
    treeItem.command = { command: commandId, title: label };
    treeItem.iconPath = new ThemeIcon(icon);
    return treeItem;
  }

  private createSeparatorItem(): TreeItem {
    const separator = new TreeItem('', TreeItemCollapsibleState.None);
    separator.iconPath = new ThemeIcon('separator');
    return separator;
  }

  private createInfoItem(label: string, tooltip: string): TreeItem {
    const infoItem = new TreeItem(label, TreeItemCollapsibleState.None);
    infoItem.tooltip = tooltip;
    infoItem.iconPath = new ThemeIcon('info');
    return infoItem;
  }
}
