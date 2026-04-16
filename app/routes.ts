import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Root — dev landing page with health check
  index("routes/index.tsx"),

  // Login
  route("login", "routes/login/index.tsx"),
  route("login/forgot-password", "routes/login/forgot-password.tsx"),
  route("login/verify-code", "routes/login/verify-code.tsx"),
  route("login/change-password", "routes/login/change-password.tsx"),

  // Admin
  layout("routes/admin/layout.tsx", [
    route("admin/dashboard",          "routes/admin/dashboard/index.tsx"),
    route("admin/flagships",          "routes/admin/flagships/index.tsx"),
    route("admin/flagships/:id",      "routes/admin/flagships/$id/index.tsx"),
    route("admin/reports",            "routes/admin/reports/index.tsx"),
    route("admin/users",              "routes/admin/users/index.tsx"),
    route("admin/users/add-user",     "routes/admin/users/add-user.tsx"),
  ]),

  // M&E
  layout("routes/me/layout.tsx", [
    route("me/flagships",             "routes/me/flagships/index.tsx"),
    route("me/flagships/add-flagship", "routes/me/flagships/add-flagship.tsx"),
    route("me/flagships/:id",         "routes/me/flagships/$id/index.tsx"),
    route("me/reports",               "routes/me/reports/index.tsx"),
    route("me/data-management",       "routes/me/data-management/index.tsx"),
    route("me/data-management/add-flagship-data",   "routes/me/data-management/add-flagship-data.tsx"),
  ]),

  // Senior Officials
  layout("routes/senior/layout.tsx", [
    route("senior/dashboard",         "routes/senior/dashboard/index.tsx"),
    route("senior/flagships",         "routes/senior/flagships/index.tsx"),
    route("senior/flagships/:id",     "routes/senior/flagships/$id/index.tsx"),
    route("senior/reports",           "routes/senior/reports/index.tsx"),
  ]),
] satisfies RouteConfig;
