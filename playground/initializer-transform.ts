import * as ts from 'typescript';

/**
 * Narrow Angular 22 JIT bridge for direct input()/input.required()/output() fields.
 * Angular's JIT compiler needs property metadata before creating an instance.
 * Preserve the real signal/emitter initializer and add the metadata its compiler
 * normally generates. isSignal is an Angular-internal compatibility contract;
 * executable runtime tests must cover upgrades. This is not a full ngc pipeline.
 */
export const initializerTransform: ts.TransformerFactory<ts.SourceFile> = context => source => {
  const factory = context.factory;
  const imports = new Map<string, string>();
  const namespaces = new Set<string>();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.moduleSpecifier.text !== '@angular/core' || statement.importClause?.isTypeOnly) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const binding of bindings.elements) {
        if (!binding.isTypeOnly) imports.set(binding.name.text, (binding.propertyName ?? binding.name).text);
      }
    } else if (bindings && ts.isNamespaceImport(bindings)) namespaces.add(bindings.name.text);
  }
  const imported = (expression: ts.Expression): string | undefined => {
    if (ts.isIdentifier(expression)) return imports.get(expression.text);
    if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression) && namespaces.has(expression.expression.text)) return expression.name.text;
    return undefined;
  };
  const core = factory.createUniqueName('__playgroundCore');
  let changed = false;
  const visit: ts.Visitor = node => {
    if (!ts.isClassDeclaration(node) || !ts.getDecorators(node)?.some(decorator =>
      ts.isCallExpression(decorator.expression) && ['Component', 'Directive'].includes(imported(decorator.expression.expression) ?? ''))) {
      return ts.visitEachChild(node, visit, context);
    }
    const members = node.members.map(member => {
      if (!ts.isPropertyDeclaration(member) || !member.initializer || !ts.isCallExpression(member.initializer)) return member;
      const call = member.initializer;
      const required = ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === 'required';
      const api = imported(required ? (call.expression as ts.PropertyAccessExpression).expression : call.expression);
      if (!api || !['input', 'output', 'model'].includes(api)) return member;
      if (api === 'model') throw new Error('model() non è ancora supportato dal playground. Usa input() e output() separati.');
      if (required && api !== 'input') throw new Error('Solo input.required() è supportato.');
      if (!ts.isIdentifier(member.name) && !ts.isStringLiteral(member.name)) throw new Error('Usa un nome semplice per la proprietà input/output.');
      if (ts.getDecorators(member)?.length) throw new Error('Non combinare input()/output() con decoratori sulla stessa proprietà.');
      const options = call.arguments[api === 'output' || required ? 0 : 1];
      let alias = member.name.text;
      if (options) {
        if (!ts.isObjectLiteralExpression(options)) throw new Error('Le opzioni input/output devono essere un oggetto scritto direttamente nella chiamata.');
        for (const option of options.properties) {
          if (!ts.isPropertyAssignment(option) || (!ts.isIdentifier(option.name) && !ts.isStringLiteral(option.name))) throw new Error('Usa proprietà esplicite nelle opzioni input/output.');
          if (option.name.text === 'alias') {
            if (!ts.isStringLiteral(option.initializer)) throw new Error('L’alias input/output deve essere una stringa letterale.');
            alias = option.initializer.text;
          }
        }
      }
      const metadata = api === 'input' ? factory.createObjectLiteralExpression([
        factory.createPropertyAssignment('isSignal', factory.createTrue()),
        factory.createPropertyAssignment('alias', factory.createStringLiteral(alias)),
        factory.createPropertyAssignment('required', required ? factory.createTrue() : factory.createFalse()),
        // Input transforms belong to the signal node, not a second decorator transform.
        factory.createPropertyAssignment('transform', factory.createIdentifier('undefined')),
      ]) : factory.createStringLiteral(alias);
      const decorator = factory.createDecorator(factory.createCallExpression(
        factory.createPropertyAccessExpression(core, api === 'input' ? 'Input' : 'Output'), undefined, [metadata],
      ));
      changed = true;
      return factory.updatePropertyDeclaration(member, [decorator, ...member.modifiers ?? []], member.name, member.questionToken ?? member.exclamationToken, member.type, member.initializer);
    });
    return factory.updateClassDeclaration(node, node.modifiers, node.name, node.typeParameters, node.heritageClauses, members);
  };
  const transformed = ts.visitEachChild(source, visit, context);
  if (!changed) return transformed;
  // The sandbox's existing require allowlist resolves this generated reference.
  const bridge = factory.createVariableStatement(undefined, factory.createVariableDeclarationList([
    factory.createVariableDeclaration(core, undefined, undefined, factory.createCallExpression(factory.createIdentifier('require'), undefined, [factory.createStringLiteral('@angular/core')])),
  ], ts.NodeFlags.Const));
  return factory.updateSourceFile(transformed, [bridge, ...transformed.statements]);
};
