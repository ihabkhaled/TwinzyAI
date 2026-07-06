import { normalizePath, srcRelativePath } from "./path-utils.mjs";

/**
 * AST/source helpers shared by the architecture rules.
 */

export const getImportSource = (node) =>
  node?.source && typeof node.source.value === "string"
    ? node.source.value
    : undefined;

export const isRelativeImport = (source) => source.startsWith(".");

/**
 * For a relative import, returns the resolved normalized path (without
 * extension resolution). For package imports, returns the source unchanged.
 */
export const resolveImportPath = (importerPath, source) => {
  if (!isRelativeImport(source)) {
    return source;
  }

  const normalizedImporter = normalizePath(importerPath);
  const importerDir = normalizedImporter.split("/").slice(0, -1);
  const segments = source.split("/");
  const resolved = [...importerDir];

  for (const segment of segments) {
    if (segment === "." || segment === "") {
      continue;
    }
    if (segment === "..") {
      resolved.pop();
    } else {
      resolved.push(segment);
    }
  }

  return resolved.join("/");
};

/** True when the import (package or resolved relative) targets a layer folder. */
export const importTargetsFolder = (importerPath, source, folderName) => {
  const resolved = resolveImportPath(importerPath, source);
  return (
    resolved.includes(`/${folderName}/`) || resolved.endsWith(`/${folderName}`)
  );
};

/**
 * Like importTargetsFolder, but resolved relative imports are trimmed to
 * their src-relative slice first. Required whenever the target folder name
 * also appears in the workspace path (e.g. "api" inside "apps/api") so a
 * plain relative import never false-positives on the workspace segment.
 * Relative imports that escape the src root target no anatomy folder.
 */
export const importTargetsModuleFolder = (importerPath, source, folderName) => {
  const resolved = resolveImportPath(importerPath, source);

  if (isRelativeImport(source)) {
    if (!resolved.includes("/src/")) {
      return false;
    }
    const scoped = srcRelativePath(resolved);
    return (
      scoped.includes(`/${folderName}/`) || scoped.endsWith(`/${folderName}`)
    );
  }

  return (
    resolved.includes(`/${folderName}/`) || resolved.endsWith(`/${folderName}`)
  );
};

/** Returns the layer folder ('controllers', 'services', ...) a file belongs to. */
export const getLayerFolder = (filePath, layerFolders) => {
  const normalized = normalizePath(filePath);
  return layerFolders.find((folder) => normalized.includes(`/${folder}/`));
};

/** True if the call expression is process.env.X or process.env['X']. */
export const isProcessEnvAccess = (node) =>
  node.type === "MemberExpression" &&
  node.object.type === "MemberExpression" &&
  node.object.object.type === "Identifier" &&
  node.object.object.name === "process" &&
  node.object.property.type === "Identifier" &&
  node.object.property.name === "env";
