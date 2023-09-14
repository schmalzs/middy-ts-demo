# middy-ts-demo

## Purpose

The purpose of this repo is to demonstrate an issue that exists when using Middy alongside the latest version of TypeScript (5.2.2) which was published on August 24, 2023.

## Background

I have a package of Middy middleware that is used across a number of lambdas. The middleware is written in TypeScript, transpiled to JS (via the TypeScript compiler), and published to a private NPM registry. The resulting JS code uses CommonJS; we haven't made the leap to ESM yet.

Middy is wonderful and publishes out a CJS and ESM copy of its library which (normally) allows us to avoid the issues and complexities that arise when intermingling CJS and ESM modules 🙂

Unfortunately, the latest version of TypeScript is preventing me from being able to build/publish my middleware package. The reason for this is due to how TypeScript incorrectly interprets Middy as being ESM without recognizing that there is a CommonJS option available for it to pull in.

There are two TypeScript config settings that are interdependent: [module](https://www.typescriptlang.org/tsconfig#module) and [moduleResolution](https://www.typescriptlang.org/tsconfig#moduleResolution). As noted in the linked docs, `node16` (and `nodenext`) should be used for "modern versions" of Node.js whereas `node` is targeted for versions of Node.js older than v10. Looking at the [recommended tsconfig for Node v18](https://github.com/tsconfig/bases/blob/main/bases/node18.json) confirms these values should be set to `node16`.

In previous versions of TypeScript, it turns out this was working somewhat accidentally for us. That is because our tsconfig had a `moduleResolution` value set to `node` instead of `node16`. This mismatched configuration with `module` was allowed in older versions of TypeScript. Some folks actually flagged this as a viable fix when people ran into issues with `moduleResolution` set to `node16` ([see GitHub issue](https://github.com/microsoft/TypeScript/issues/50009#issuecomment-1555993381)). Ultimately, having mismatched `module` and `moduleResolution` values in this way was flagged as a TypeScript bug and fixed in version 5.2.2 ([see release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-2/#module-and-moduleresolution-must-match-under-recent-node-js-settings)).

As such, we've updated our `moduleResoution` value to be `node16`, as recommended and now enforced by TypeScript.

## Problem

When attempting to build our middleware package with TypeScript 5.2.2, we receive the following error:

```
src/index.ts:1:19 - error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import("@middy/core")' call instead.
  To convert this file to an ECMAScript module, change its file extension to '.mts', or add the field `"type": "module"` to '/workspaces/middy-ts-demo/package.json'.
```

## Demo Problem Using This Repo

1. Install dependencies
   ```sh
   $ npm install
   ```
2. Attempt to run a build -- this executes the TypeScript compiler.
   ```sh
   $ npm run build
   ```
3. Note that the following error is thrown by the TypeScript compiler.
   ```
   > middy-ts-demo@1.0.0 build
   > tsc
   
   src/index.ts:1:19 - error TS1479: The current file is a CommonJS module whose imports will produce 'require' calls; however, the referenced file is an ECMAScript module and cannot be imported with 'require'. Consider writing a dynamic 'import("@middy/core")' call instead.
     To convert this file to an ECMAScript module, change its file extension to '.mts', or add the field `"type": "module"` to '/workspaces/middy-ts-demo/package.json'.

   1 import middy from '@middy/core';
                       ~~~~~~~~~~~~~
   
   
   Found 1 error in src/index.ts:1
   ```

## Possible Fix

It seems as though TypeScript is incorrectly interpreting our dependency on Middy as ESM, even though the CommonJS version is available in the package. I believe TypeScript is viewing the combination of the `index.d.ts` file and the `type` of `module` in the package.json as indicators to the compiler that the module is ESM.

However, I have found that by utilizing the [.cts](https://www.typescriptlang.org/docs/handbook/esm-node.html#new-file-extensions) file extension for the type definitions in the CommonJS version of Middy, TypeScript properly understands that the package is CommonJS.

## Demo Possible Fix Using This Repo

_These steps build upon the steps outlined in the **Demo Problem Using This Repo** section above. Complete those steps first if you haven't already._

1. Manually create a copy of `node_modules/@middy/core/index.d.ts` named `node_modules/@middy/core/index.d.cts`.
2. Manualy update the `exports` value of the `node_modules/@middy/core/package.json` file to the following. Note that the only change is to the value of `require` > `types`.
   ```
   "exports": {
     ".": {
       "import": {
         "types": "./index.d.ts",
         "default": "./index.js"
       },
       "require": {
         "types": "./index.d.cts",
         "default": "./index.cjs"
       }
     }
   },
   ```
3. Attempt to run a build
   ```sh
   $ npm run build
   ```
4. Note that the build completes successfully.
