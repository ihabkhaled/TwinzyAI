# 16 — Backend Architecture

Module layout: modules/NAME/{controllers,managers,services,adapters,dto,schemas,mappers,
constants,enums,types,interfaces,utils,tests,index.ts} — omit folders you do not need.
Layer order: Controller -> Manager -> Service -> Repository. Adapters are leaves called by
services. Cross-module use goes through the module exports (index.ts), never deep imports.
Global concerns (config, logger, filters, guards) live in config/, infrastructure/, common/.
