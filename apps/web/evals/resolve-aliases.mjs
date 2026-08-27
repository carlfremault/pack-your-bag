import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ALIAS_BASE = path.resolve(import.meta.dirname, '../src');
const EXTENSIONS = ['.ts', '.tsx', '.mts', '.js', '.mjs'];

function resolveWithExtension(filePath) {
  if (existsSync(filePath)) return filePath;

  for (const ext of EXTENSIONS) {
    if (existsSync(filePath + ext)) return filePath + ext;
  }

  for (const ext of EXTENSIONS) {
    const indexPath = path.join(filePath, `index${ext}`);
    if (existsSync(indexPath)) return indexPath;
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const resolvedPath = path.join(ALIAS_BASE, specifier.slice(2));
    const found = resolveWithExtension(resolvedPath);
    return nextResolve(pathToFileURL(found ?? resolvedPath).href, context);
  }

  if (specifier.startsWith('.') && context.parentURL) {
    const parentPath = fileURLToPath(context.parentURL);
    const resolvedPath = path.resolve(path.dirname(parentPath), specifier);
    const found = resolveWithExtension(resolvedPath);

    if (found) {
      return nextResolve(pathToFileURL(found).href, context);
    }
  }

  return nextResolve(specifier, context);
}
