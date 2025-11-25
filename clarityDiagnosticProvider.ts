import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class ClarityDiagnosticProvider {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private timeout: NodeJS.Timeout | undefined;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('clarity');
    }

    public activate(context: vscode.ExtensionContext) {
        // Register diagnostic provider
        context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.document.languageId === 'clarity') {
                    // Debounce the syntax checking to avoid excessive re-checking
                    if (this.timeout) {
                        clearTimeout(this.timeout);
                    }
                    this.timeout = setTimeout(() => {
                        this.checkSyntax(e.document);
                    }, 300); // 300ms delay
                }
            }),
            vscode.workspace.onDidOpenTextDocument((doc) => {
                if (doc.languageId === 'clarity') {
                    this.checkSyntax(doc);
                }
            }),
            vscode.workspace.onDidSaveTextDocument((doc) => {
                if (doc.languageId === 'clarity') {
                    this.checkSyntax(doc);
                }
            }),
            // Force refresh on document change
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.document.languageId === 'clarity') {
                    // Clear diagnostics immediately on change
                    this.diagnosticCollection.delete(e.document.uri);
                    // Re-check syntax after a short delay
                    if (this.timeout) {
                        clearTimeout(this.timeout);
                    }
                    this.timeout = setTimeout(() => {
                        this.checkSyntax(e.document);
                    }, 100); // Shorter delay for immediate feedback
                }
            })
        );
    }

    private checkSyntax(document: vscode.TextDocument) {
        // Clear existing diagnostics first
        this.diagnosticCollection.delete(document.uri);
        
        const diagnostics: vscode.Diagnostic[] = [];
        const text = document.getText();
        const lines = text.split('\n');

        console.log(`Checking syntax for ${document.uri.toString()}, ${lines.length} lines`);

        // Check for common syntax errors
        this.checkUnmatchedParentheses(document, lines, diagnostics);
        this.checkInvalidKeywords(document, lines, diagnostics);
        this.checkMissingKeywords(document, lines, diagnostics);
        this.checkInvalidNumbers(document, lines, diagnostics);
        this.checkInvalidStrings(document, lines, diagnostics);
        // Temporarily disable function call detection - too many false positives
        // this.checkInvalidFunctionCalls(document, lines, diagnostics);
        this.checkInvalidDefineStatements(document, lines, diagnostics);
        this.checkInvalidOperators(document, lines, diagnostics);
        // Temporarily disable aggressive type checking to prevent false positives
        // this.checkInvalidTypes(document, lines, diagnostics);

        console.log(`Found ${diagnostics.length} diagnostics`);
        if (diagnostics.length > 0) {
            console.log('Diagnostics:', diagnostics.map(d => `${d.message} at line ${d.range.start.line + 1}`));
        }

        // Always set diagnostics (even if empty) to clear previous ones
        this.diagnosticCollection.set(document.uri, diagnostics);
    }

    private checkUnmatchedParentheses(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        let openParens = 0;
        let closeParens = 0;
        let inString = false;
        let inComment = false;

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const prevChar = i > 0 ? line[i - 1] : '';
                
                // Check for comment start
                if (char === ';' && prevChar === ';') {
                    inComment = true;
                }
                
                // Skip everything if in comment
                if (inComment) {
                    continue;
                }
                
                // Check for string start/end
                if (char === '"' && prevChar !== '\\') {
                    inString = !inString;
                }
                
                // Skip everything if in string
                if (inString) {
                    continue;
                }
                
                // Count parentheses
                if (char === '(') {
                    openParens++;
                } else if (char === ')') {
                    closeParens++;
                }
            }
            
            // Reset comment flag for next line
            inComment = false;
        }

        if (openParens !== closeParens) {
            const lastLine = lines.length - 1;
            const range = new vscode.Range(lastLine, 0, lastLine, lines[lastLine].length);
            const diagnostic = new vscode.Diagnostic(
                range,
                `Unmatched parentheses: ${openParens} opening, ${closeParens} closing`,
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = 'Clarity Syntax';
            diagnostics.push(diagnostic);
        }
    }

    private checkInvalidKeywords(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        const validKeywords = new Set([
            'define-public', 'define-private', 'define-read-only', 'define-trait',
            'define-fungible-token', 'define-non-fungible-token', 'define-constant',
            'define-data-var', 'define-map', 'if', 'when', 'match', 'let', 'begin',
            'ok', 'err', 'some', 'none', 'true', 'false', 'and', 'or', 'not',
            'is-eq', 'is-ok', 'is-err', 'is-some', 'is-none', 'unwrap!', 'unwrap-panic',
            'unwrap-err!', 'unwrap-err-panic', 'try!', 'asserts!', 'expects!',
            'expects-err!', 'default-to', 'as-contract', 'as-max-len?', 'to-int',
            'to-uint', 'contract-caller', 'tx-sender', 'contract-owner', 'block-height',
            'stx-transfer?', 'stx-get-balance', 'var-get', 'var-set', 'map-get?',
            'map-set', 'map-insert', 'map-delete', 'map-insert!', 'map-set!', 'print'
        ]);

        lines.forEach((line, lineIndex) => {
            // Check for invalid keywords (words that look like keywords but aren't)
            const words = line.match(/\b[a-zA-Z][a-zA-Z0-9_-]*\b/g) || [];
            for (const word of words) {
                if (word.startsWith('define-') && !validKeywords.has(word)) {
                    const range = new vscode.Range(lineIndex, line.indexOf(word), lineIndex, line.indexOf(word) + word.length);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Invalid keyword: '${word}'. Did you mean one of: ${Array.from(validKeywords).filter(k => k.startsWith('define-')).join(', ')}?`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'Clarity Syntax';
                    diagnostics.push(diagnostic);
                }
            }
        });
    }

    private checkMissingKeywords(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        lines.forEach((line, lineIndex) => {
            const trimmedLine = line.trim();
            
            // Check for function definitions missing define-public/private/read-only
            // Only check lines that start with ( but don't have define- and are not comments
            if (trimmedLine.startsWith('(') && !trimmedLine.startsWith('(define-') && !trimmedLine.startsWith('(;')) {
                // Look for function-like patterns: (function-name (param1 type1) (param2 type2))
                const functionPattern = /^\(([a-zA-Z][a-zA-Z0-9_-]*)\s*\(/;
                const match = trimmedLine.match(functionPattern);
                
                if (match) {
                    const functionName = match[1];
                    console.log(`Checking line ${lineIndex + 1}: "${trimmedLine}"`);
                    console.log(`Function name: ${functionName}`);
                    
                    // Check if this looks like a function definition (has parameters)
                    const hasParams = /\([^)]*\)/.test(trimmedLine);
                    console.log(`Has params: ${hasParams}`);
                    
                    // Check if it's already a function call (not a definition)
                    const isCall = this.isFunctionCall(trimmedLine);
                    console.log(`Is function call: ${isCall}`);
                    
                    // Only flag if it's clearly a function definition and not already defined
                    if (hasParams && !trimmedLine.includes('define-') && !isCall) {
                        console.log(`Flagging missing define- for: ${functionName}`);
                        const range = new vscode.Range(lineIndex, 0, lineIndex, functionName.length + 1);
                        const diagnostic = new vscode.Diagnostic(
                            range,
                            `Missing function definition keyword. Add 'define-public', 'define-private', or 'define-read-only' before function name.`,
                            vscode.DiagnosticSeverity.Error
                        );
                        diagnostic.source = 'Clarity Syntax';
                        diagnostics.push(diagnostic);
                    } else {
                        console.log(`Not flagging: ${functionName} - has define: ${trimmedLine.includes('define-')}, is call: ${isCall}`);
                    }
                }
            }
            
            // Check for missing 'let' in let expressions
            if (trimmedLine.startsWith('(') && !trimmedLine.startsWith('(let') && !trimmedLine.startsWith('(define-') && !trimmedLine.startsWith('(;')) {
                // Look for patterns like: ((variable value) ...)
                const letPattern = /^\(\([a-zA-Z][a-zA-Z0-9_-]*\s+/;
                const match = trimmedLine.match(letPattern);
                
                if (match) {
                    const range = new vscode.Range(lineIndex, 0, lineIndex, 1);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Missing 'let' keyword. Use 'let' to bind variables.`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'Clarity Syntax';
                    diagnostics.push(diagnostic);
                }
            }
        });
    }

    private isFunctionCall(line: string): boolean {
        const trimmed = line.trim();
        
        // Check if this looks like a function call rather than a definition
        // Function calls typically have arguments that are not type declarations
        const functionCallPatterns = [
            /^\([a-zA-Z][a-zA-Z0-9_-]*\s+[^()]*\)$/, // Simple function call
            /^\([a-zA-Z][a-zA-Z0-9_-]*\s+[^()]*\s+[^()]*\)$/, // Function call with multiple args
            /^\([a-zA-Z][a-zA-Z0-9_-]*\s*\)$/, // Function call with no args
        ];
        
        // Also check for common function call patterns
        const isCommonFunctionCall = /^\([a-zA-Z][a-zA-Z0-9_-]*\s+(ok|err|true|false|u\d+|i\d+|"[^"]*"|\([^)]*\))\)$/.test(trimmed);
        
        // Check if it's a function call by looking at the arguments
        // Function definitions have type declarations like (param uint), (param principal)
        // Function calls have actual values like (param u100), (param "hello")
        const hasTypeDeclarations = /\([a-zA-Z][a-zA-Z0-9_-]*\s+(uint|int|bool|string-ascii|string-utf8|principal|list|tuple|optional|response|buff|buff-ascii|buff-utf8|trait|fungible-token|non-fungible-token)/.test(trimmed);
        
        console.log(`isFunctionCall check for: "${trimmed}"`);
        console.log(`Pattern match: ${functionCallPatterns.some(pattern => pattern.test(trimmed))}`);
        console.log(`Common function call: ${isCommonFunctionCall}`);
        console.log(`Has type declarations: ${hasTypeDeclarations}`);
        
        return functionCallPatterns.some(pattern => pattern.test(trimmed)) || isCommonFunctionCall || !hasTypeDeclarations;
    }

    private checkInvalidNumbers(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        lines.forEach((line, lineIndex) => {
            // Check for invalid number formats
            const numberPattern = /\b(u|i)?\d+\b/g;
            let match;
            while ((match = numberPattern.exec(line)) !== null) {
                const number = match[0];
                if (number.startsWith('u') && number.length > 1) {
                    // Check if it's a valid uint
                    const num = parseInt(number.substring(1));
                    if (isNaN(num) || num < 0) {
                        const range = new vscode.Range(lineIndex, match.index, lineIndex, match.index + number.length);
                        const diagnostic = new vscode.Diagnostic(
                            range,
                            `Invalid uint: '${number}'. Uints must be non-negative integers.`,
                            vscode.DiagnosticSeverity.Error
                        );
                        diagnostic.source = 'Clarity Syntax';
                        diagnostics.push(diagnostic);
                    }
                } else if (number.startsWith('i') && number.length > 1) {
                    // Check if it's a valid int
                    const num = parseInt(number.substring(1));
                    if (isNaN(num)) {
                        const range = new vscode.Range(lineIndex, match.index, lineIndex, match.index + number.length);
                        const diagnostic = new vscode.Diagnostic(
                            range,
                            `Invalid int: '${number}'. Ints must be valid integers.`,
                            vscode.DiagnosticSeverity.Error
                        );
                        diagnostic.source = 'Clarity Syntax';
                        diagnostics.push(diagnostic);
                    }
                }
            }
        });
    }

    private checkInvalidStrings(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        lines.forEach((line, lineIndex) => {
            // Check for unterminated strings - improved logic
            let inString = false;
            let stringStart = -1;
            let inUnicodeString = false;
            let unicodeStringStart = -1;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const prevChar = i > 0 ? line[i - 1] : '';
                
                if (!inString && !inUnicodeString) {
                    // Check for start of regular string
                    if (char === '"' && prevChar !== '\\') {
                        inString = true;
                        stringStart = i;
                    }
                    // Check for start of unicode string
                    else if (char === '"' && i > 0 && line[i - 1] === 'u') {
                        inUnicodeString = true;
                        unicodeStringStart = i - 1;
                    }
                } else if (inString) {
                    // Check for end of regular string
                    if (char === '"' && prevChar !== '\\') {
                        inString = false;
                        stringStart = -1;
                    }
                } else if (inUnicodeString) {
                    // Check for end of unicode string
                    if (char === '"' && prevChar !== '\\') {
                        inUnicodeString = false;
                        unicodeStringStart = -1;
                    }
                }
            }
            
            // Report unterminated strings
            if (inString) {
                const range = new vscode.Range(lineIndex, stringStart, lineIndex, line.length);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    'Unterminated string literal. Missing closing quote.',
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.source = 'Clarity Syntax';
                diagnostics.push(diagnostic);
            }
            
            if (inUnicodeString) {
                const range = new vscode.Range(lineIndex, unicodeStringStart, lineIndex, line.length);
                const diagnostic = new vscode.Diagnostic(
                    range,
                    'Unterminated unicode string literal. Missing closing quote.',
                    vscode.DiagnosticSeverity.Error
                );
                diagnostic.source = 'Clarity Syntax';
                diagnostics.push(diagnostic);
            }
        });
    }

    private checkInvalidFunctionCalls(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        lines.forEach((line, lineIndex) => {
            // Only check for function calls in specific contexts (not in define statements or type annotations)
            if (line.trim().startsWith('(') && !line.trim().startsWith('(define-')) {
                // Check for function calls without proper parentheses
                const functionPattern = /\b[a-zA-Z][a-zA-Z0-9_-]*\s+(?![(])/g;
                let match;
                while ((match = functionPattern.exec(line)) !== null) {
                    const word = match[0].trim();
                    if (word && !word.includes('(') && !word.includes(')')) {
                        // Check if it's not a keyword or type
                        const validKeywords = new Set(['define-public', 'define-private', 'define-read-only', 'define-trait', 'define-fungible-token', 'define-non-fungible-token', 'define-constant', 'define-data-var', 'define-map', 'if', 'when', 'match', 'let', 'begin', 'ok', 'err', 'some', 'none', 'true', 'false', 'and', 'or', 'not', 'is-eq', 'is-ok', 'is-err', 'is-some', 'is-none', 'unwrap!', 'unwrap-panic', 'unwrap-err!', 'unwrap-err-panic', 'try!', 'asserts!', 'expects!', 'expects-err!', 'default-to', 'as-contract', 'as-max-len?', 'to-int', 'to-uint', 'contract-caller', 'tx-sender', 'contract-owner', 'block-height', 'stx-transfer?', 'stx-get-balance', 'var-get', 'var-set', 'map-get?', 'map-set', 'map-insert', 'map-delete', 'map-insert!', 'map-set!', 'print']);
                        const validTypes = new Set(['uint', 'int', 'bool', 'string-ascii', 'string-utf8', 'principal', 'list', 'tuple', 'optional', 'response', 'buff', 'buff-ascii', 'buff-utf8', 'trait', 'fungible-token', 'non-fungible-token']);
                        
                        if (!validKeywords.has(word) && !validTypes.has(word)) {
                            const range = new vscode.Range(lineIndex, match.index, lineIndex, match.index + word.length);
                            const diagnostic = new vscode.Diagnostic(
                                range,
                                `Invalid function call: '${word}'. Function calls must be enclosed in parentheses.`,
                                vscode.DiagnosticSeverity.Warning
                            );
                            diagnostic.source = 'Clarity Syntax';
                            diagnostics.push(diagnostic);
                        }
                    }
                }
            }
        });
    }

    private checkInvalidDefineStatements(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        lines.forEach((line, lineIndex) => {
            // Check for define statements without proper syntax
            const definePattern = /\(define-(public|private|read-only|trait|fungible-token|non-fungible-token|constant|data-var|map)\s+([^)]+)\)/g;
            let match;
            while ((match = definePattern.exec(line)) !== null) {
                const defineType = match[1];
                const content = match[2].trim();
                
                if (!content) {
                    const range = new vscode.Range(lineIndex, match.index, lineIndex, match.index + match[0].length);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Invalid ${defineType} definition. Missing name and body.`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'Clarity Syntax';
                    diagnostics.push(diagnostic);
                }
            }
        });
    }

    private checkInvalidOperators(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        const validOperators = new Set(['+', '-', '*', '/', '%', 'mod', 'pow', '=', '!=', '<', '<=', '>', '>=', 'concat', 'str-len', 'str-to-int', 'int-to-str', 'len', 'append', 'merge', 'get']);
        
        lines.forEach((line, lineIndex) => {
            // Check for invalid operators
            const operatorPattern = /[+\-*/%=<>!]+/g;
            let match;
            while ((match = operatorPattern.exec(line)) !== null) {
                const operator = match[0];
                if (!validOperators.has(operator) && !operator.match(/^[+\-*/%=<>!]+$/)) {
                    const range = new vscode.Range(lineIndex, match.index, lineIndex, match.index + operator.length);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Invalid operator: '${operator}'. Valid operators are: ${Array.from(validOperators).join(', ')}`,
                        vscode.DiagnosticSeverity.Error
                    );
                    diagnostic.source = 'Clarity Syntax';
                    diagnostics.push(diagnostic);
                }
            }
        });
    }

    private checkInvalidTypes(document: vscode.TextDocument, lines: string[], diagnostics: vscode.Diagnostic[]) {
        const validTypes = new Set(['uint', 'int', 'bool', 'string-ascii', 'string-utf8', 'principal', 'list', 'tuple', 'optional', 'response', 'buff', 'buff-ascii', 'buff-utf8', 'trait', 'fungible-token', 'non-fungible-token']);
        const validKeywords = new Set([
            'define-public', 'define-private', 'define-read-only', 'define-trait',
            'define-fungible-token', 'define-non-fungible-token', 'define-constant',
            'define-data-var', 'define-map', 'if', 'when', 'match', 'let', 'begin',
            'ok', 'err', 'some', 'none', 'true', 'false', 'and', 'or', 'not',
            'is-eq', 'is-ok', 'is-err', 'is-some', 'is-none', 'unwrap!', 'unwrap-panic',
            'unwrap-err!', 'unwrap-err-panic', 'try!', 'asserts!', 'expects!',
            'expects-err!', 'default-to', 'as-contract', 'as-max-len?', 'to-int',
            'to-uint', 'contract-caller', 'tx-sender', 'contract-owner', 'block-height',
            'stx-transfer?', 'stx-get-balance', 'var-get', 'var-set', 'map-get?',
            'map-set', 'map-insert', 'map-delete', 'map-insert!', 'map-set!', 'print'
        ]);
        
        lines.forEach((line, lineIndex) => {
            // Only check for invalid types in specific contexts (after : or in type annotations)
            const typeAnnotationPattern = /:\s*([a-zA-Z][a-zA-Z0-9_-]*)/g;
            let match;
            while ((match = typeAnnotationPattern.exec(line)) !== null) {
                const word = match[1];
                if (word.includes('-') && !validTypes.has(word) && !validKeywords.has(word)) {
                    // Check if it looks like a type but isn't valid
                    const range = new vscode.Range(lineIndex, match.index + 2, lineIndex, match.index + 2 + word.length);
                    const diagnostic = new vscode.Diagnostic(
                        range,
                        `Invalid type: '${word}'. Valid types are: ${Array.from(validTypes).join(', ')}`,
                        vscode.DiagnosticSeverity.Warning
                    );
                    diagnostic.source = 'Clarity Syntax';
                    diagnostics.push(diagnostic);
                }
            }
        });
    }

    public clearDiagnostics(document: vscode.TextDocument) {
        this.diagnosticCollection.delete(document.uri);
    }

    public clearAllDiagnostics() {
        this.diagnosticCollection.clear();
    }

    public dispose() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.diagnosticCollection.dispose();
    }
}
