import { TreeDataProvider, TreeItem, TreeItemCollapsibleState, Command, ProviderResult, EventEmitter, Event, ThemeIcon } from 'vscode';

export interface ClarityBlock {
  id: string;
  type: 'function' | 'constant' | 'variable' | 'map' | 'condition' | 'operation' | 'loop';
  label: string;
  code: string;
  children?: ClarityBlock[];
  parameters?: { name: string; type: string; value?: string }[];
}

export class ClarityBlockEditorProvider implements TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | null | void> = new EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: Event<TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  private blocks: ClarityBlock[] = [];
  private generatedCode: string = '';

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): ProviderResult<TreeItem[]> {
    if (element) {
      // Return children of a specific block
      const blockId = element.id;
      if (blockId) {
        const block = this.findBlockById(blockId);
        if (block && block.children) {
          return block.children.map(child => this.createBlockItem(child));
        }
      }
      return [];
    }
    
    // Root items: Available block types and current blocks
    const items: TreeItem[] = [
      this.createCategoryItem('Available Blocks', 'block-types'),
      this.createBlockTypeItem('Function', 'function', 'Define a function'),
      this.createBlockTypeItem('Constant', 'constant', 'Define a constant'),
      this.createBlockTypeItem('Variable', 'variable', 'Define a data variable'),
      this.createBlockTypeItem('Map', 'map', 'Define a map'),
      this.createBlockTypeItem('Condition', 'condition', 'If/When statement'),
      this.createBlockTypeItem('Operation', 'operation', 'Arithmetic operation'),
      this.createSeparatorItem(),
      this.createCategoryItem('Current Blocks', 'current-blocks'),
      ...this.blocks.map(block => this.createBlockItem(block)),
      this.createSeparatorItem(),
      this.createActionItem('Generate Code', 'clarity.generateCode', 'Generate Clarity code from blocks', 'code'),
      this.createActionItem('Clear All', 'clarity.clearBlocks', 'Clear all blocks', 'trash')
    ];
    
    return items;
  }

  private createCategoryItem(label: string, id: string): TreeItem {
    const item = new TreeItem(label, TreeItemCollapsibleState.Expanded);
    item.id = id;
    item.iconPath = new ThemeIcon('folder');
    return item;
  }

  private createBlockTypeItem(label: string, type: string, tooltip: string): TreeItem {
    const item = new TreeItem(label, TreeItemCollapsibleState.None);
    item.tooltip = tooltip;
    item.command = { command: 'clarity.addBlock', title: label, arguments: [type] };
    item.iconPath = new ThemeIcon('add');
    return item;
  }

  private createBlockItem(block: ClarityBlock): TreeItem {
    const item = new TreeItem(block.label, TreeItemCollapsibleState.Collapsed);
    item.id = block.id;
    item.tooltip = block.code;
    item.iconPath = this.getBlockIcon(block.type);
    item.contextValue = 'clarity-block';
    return item;
  }

  private createActionItem(label: string, command: string, tooltip: string, icon: string): TreeItem {
    const item = new TreeItem(label, TreeItemCollapsibleState.None);
    item.tooltip = tooltip;
    item.command = { command, title: label };
    item.iconPath = new ThemeIcon(icon);
    return item;
  }

  private createSeparatorItem(): TreeItem {
    const separator = new TreeItem('', TreeItemCollapsibleState.None);
    separator.iconPath = new ThemeIcon('separator');
    return separator;
  }

  private getBlockIcon(type: string): ThemeIcon {
    const iconMap: { [key: string]: string } = {
      'function': 'symbol-method',
      'constant': 'symbol-constant',
      'variable': 'symbol-variable',
      'map': 'symbol-array',
      'condition': 'symbol-boolean',
      'operation': 'symbol-operator',
      'loop': 'symbol-event'
    };
    return new ThemeIcon(iconMap[type] || 'symbol-misc');
  }

  private findBlockById(id: string): ClarityBlock | undefined {
    for (const block of this.blocks) {
      if (block.id === id) return block;
      if (block.children) {
        const found = this.findBlockInChildren(block.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  private findBlockInChildren(children: ClarityBlock[], id: string): ClarityBlock | undefined {
    for (const child of children) {
      if (child.id === id) return child;
      if (child.children) {
        const found = this.findBlockInChildren(child.children, id);
        if (found) return found;
      }
    }
    return undefined;
  }

  addBlock(type: string): void {
    const blockId = `block_${Date.now()}`;
    const block = this.createBlockByType(type, blockId);
    this.blocks.push(block);
    this.refresh();
  }

  private createBlockByType(type: string, id: string): ClarityBlock {
    const blockTemplates: { [key: string]: ClarityBlock } = {
      'function': {
        id,
        type: 'function',
        label: 'New Function',
        code: '(define-public (function-name (param1 uint))\n  (ok true)\n)',
        parameters: [
          { name: 'function-name', type: 'string', value: 'function-name' },
          { name: 'param1', type: 'string', value: 'param1' },
          { name: 'param-type', type: 'string', value: 'uint' }
        ]
      },
      'constant': {
        id,
        type: 'constant',
        label: 'New Constant',
        code: '(define-constant CONSTANT-NAME value)',
        parameters: [
          { name: 'CONSTANT-NAME', type: 'string', value: 'CONSTANT-NAME' },
          { name: 'value', type: 'string', value: 'value' }
        ]
      },
      'variable': {
        id,
        type: 'variable',
        label: 'New Variable',
        code: '(define-data-var variable-name type initial-value)',
        parameters: [
          { name: 'variable-name', type: 'string', value: 'variable-name' },
          { name: 'type', type: 'string', value: 'uint' },
          { name: 'initial-value', type: 'string', value: 'u0' }
        ]
      },
      'map': {
        id,
        type: 'map',
        label: 'New Map',
        code: '(define-map map-name key-type value-type)',
        parameters: [
          { name: 'map-name', type: 'string', value: 'map-name' },
          { name: 'key-type', type: 'string', value: 'uint' },
          { name: 'value-type', type: 'string', value: 'uint' }
        ]
      },
      'condition': {
        id,
        type: 'condition',
        label: 'New Condition',
        code: '(if condition\n  then-expression\n  else-expression\n)',
        parameters: [
          { name: 'condition', type: 'string', value: 'condition' },
          { name: 'then-expression', type: 'string', value: 'then-expression' },
          { name: 'else-expression', type: 'string', value: 'else-expression' }
        ]
      },
      'operation': {
        id,
        type: 'operation',
        label: 'New Operation',
        code: '(+ value1 value2)',
        parameters: [
          { name: 'operator', type: 'string', value: '+' },
          { name: 'value1', type: 'string', value: 'value1' },
          { name: 'value2', type: 'string', value: 'value2' }
        ]
      }
    };

    return blockTemplates[type] || {
      id,
      type: 'function',
      label: 'New Block',
      code: ';; New block',
      parameters: []
    };
  }

  generateCode(): string {
    this.generatedCode = this.blocks.map(block => this.generateBlockCode(block)).join('\n\n');
    return this.generatedCode;
  }

  private generateBlockCode(block: ClarityBlock): string {
    let code = block.code;
    
    // Replace parameters with their values
    if (block.parameters) {
      block.parameters.forEach(param => {
        const placeholder = `{${param.name}}`;
        code = code.replace(new RegExp(placeholder, 'g'), param.value || param.name);
      });
    }
    
    return code;
  }

  clearBlocks(): void {
    this.blocks = [];
    this.generatedCode = '';
    this.refresh();
  }

  getBlocks(): ClarityBlock[] {
    return this.blocks;
  }

  updateBlock(id: string, updates: Partial<ClarityBlock>): void {
    const block = this.findBlockById(id);
    if (block) {
      Object.assign(block, updates);
      this.refresh();
    }
  }
}
