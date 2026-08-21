/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as contactos from "../contactos.js";
import type * as empresas from "../empresas.js";
import type * as http from "../http.js";
import type * as iniciativas from "../iniciativas.js";
import type * as interacciones from "../interacciones.js";
import type * as lib from "../lib.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as stages from "../stages.js";
import type * as tareas from "../tareas.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  contactos: typeof contactos;
  empresas: typeof empresas;
  http: typeof http;
  iniciativas: typeof iniciativas;
  interacciones: typeof interacciones;
  lib: typeof lib;
  seed: typeof seed;
  settings: typeof settings;
  stages: typeof stages;
  tareas: typeof tareas;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
