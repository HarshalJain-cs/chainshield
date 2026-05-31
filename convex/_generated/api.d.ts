/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as claims from "../claims.js";
import type * as crons from "../crons.js";
import type * as governance from "../governance.js";
import type * as http from "../http.js";
import type * as lp from "../lp.js";
import type * as notifications from "../notifications.js";
import type * as policies from "../policies.js";
import type * as pools from "../pools.js";
import type * as premiums from "../premiums.js";
import type * as products from "../products.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  claims: typeof claims;
  crons: typeof crons;
  governance: typeof governance;
  http: typeof http;
  lp: typeof lp;
  notifications: typeof notifications;
  policies: typeof policies;
  pools: typeof pools;
  premiums: typeof premiums;
  products: typeof products;
  seed: typeof seed;
  users: typeof users;
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
