import { isInFolder, isTestFile, normalizePath } from '../shared/path-utils.mjs';

/**
 * Domain definitions (interfaces, type aliases, enums, schema/config object
 * constants) must live in their dedicated folders (types/, interfaces/,
 * enums/, constants/, dto/, schemas/, model/) — not inline in controllers,
 * managers, services, repositories, gateways, or components.
 *
 * A single local Props interface is allowed in a TSX component file: it is
 * a view contract, not a domain definition (documented in rules/05).
 */
const LAYER_FOLDERS = [
  'controllers',
  'managers',
  'services',
  'repositories',
  'gateways',
  'components',
  'ui',
];

const DEFINITION_HOMES = [
  'types',
  'interfaces',
  'enums',
  'constants',
  'dto',
  'schemas',
  'model',
  'config',
];

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid inline domain type/interface/enum/constant-object definitions in layer files.',
    },
    schema: [],
    messages: {
      noInline:
        'Do not define {{kind}} inline in a {{layer}} file. Move it to the module types/interfaces/enums/constants/dto/schemas folder.',
    },
  },
  create(context) {
    const filename = normalizePath(context.filename);

    if (isTestFile(filename)) {
      return {};
    }

    if (DEFINITION_HOMES.some((home) => isInFolder(filename, home))) {
      return {};
    }

    const layer = LAYER_FOLDERS.find((folder) => isInFolder(filename, folder));
    if (layer === undefined) {
      return {};
    }

    const isTsx = filename.endsWith('.tsx');

    return {
      TSInterfaceDeclaration(node) {
        if (isTsx && node.id.name.endsWith('Props')) {
          return;
        }
        context.report({ node, messageId: 'noInline', data: { kind: 'an interface', layer } });
      },
      TSTypeAliasDeclaration(node) {
        if (isTsx && node.id.name.endsWith('Props')) {
          return;
        }
        context.report({ node, messageId: 'noInline', data: { kind: 'a type alias', layer } });
      },
      TSEnumDeclaration(node) {
        context.report({ node, messageId: 'noInline', data: { kind: 'an enum', layer } });
      },
    };
  },
};
