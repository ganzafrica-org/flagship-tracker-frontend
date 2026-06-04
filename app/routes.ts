import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Chrome DevTools automatic workspace discovery (harmless probe when DevTools is open)
  route(
    ".well-known/appspecific/com.chrome.devtools.json",
    "routes/well-known.chrome-devtools.tsx",
  ),

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
    route("admin/individuals",                  "routes/admin/individuals/index.tsx"),
    route("admin/individuals/add-individual",   "routes/admin/individuals/add.tsx"),
    route("admin/individuals/update",           "routes/admin/individuals/update.tsx"),
    route("admin/value-chains",       "routes/admin/value-chains/index.tsx"),
    route("admin/value-chains/add",   "routes/admin/value-chains/add.tsx"),
    route("admin/kpis",               "routes/admin/kpis/index.tsx"),
    route("admin/kpis/add",           "routes/admin/kpis/add.tsx"),
    route("admin/agencies",           "routes/admin/agencies/index.tsx"),
    route("admin/agencies/add",       "routes/admin/agencies/add.tsx"),
    route("admin/agencies/types",     "routes/admin/agencies/types.tsx"),
    route("admin/funders",            "routes/admin/funders/index.tsx"),
    route("admin/funders/add",        "routes/admin/funders/add.tsx"),
    route("admin/funders/types",      "routes/admin/funders/types.tsx"),
    route("admin/cooperatives",       "routes/admin/cooperatives/index.tsx"),
    route("admin/cooperatives/add",   "routes/admin/cooperatives/add.tsx"),
  ]),

  // M&E
  layout("routes/me/layout.tsx", [
    route("me/flagships",             "routes/me/flagships/index.tsx"),
    route("me/flagships/add-flagship", "routes/me/flagships/add-flagship.tsx"),
    route("me/flagships/:id",         "routes/me/flagships/$id/index.tsx"),
    route("me/cooperatives",          "routes/me/cooperatives/index.tsx"),
    route("me/cooperatives/add-cooperative", "routes/me/cooperatives/add-cooperative.tsx"),
    route("me/reports",               "routes/me/reports/index.tsx"),
    route("me/individuals",                     "routes/me/individuals/index.tsx"),
    route("me/individuals/add-individual",      "routes/me/individuals/add.tsx"),
    route("me/individuals/update",              "routes/me/individuals/update.tsx"),
    route("me/value-chains",       "routes/me/value-chains/index.tsx"),
    route("me/value-chains/add",   "routes/me/value-chains/add.tsx"),
    route("me/kpis",               "routes/me/kpis/index.tsx"),
    route("me/kpis/add",           "routes/me/kpis/add.tsx"),
    route("me/agencies",           "routes/me/agencies/index.tsx"),
    route("me/agencies/add",       "routes/me/agencies/add.tsx"),
    route("me/agencies/types",     "routes/me/agencies/types.tsx"),
    route("me/funders",            "routes/me/funders/index.tsx"),
    route("me/funders/add",        "routes/me/funders/add.tsx"),
    route("me/funders/types",      "routes/me/funders/types.tsx"),
  ]),

  // Senior Officials
  layout("routes/senior/layout.tsx", [
    route("senior/dashboard",         "routes/senior/dashboard/index.tsx"),
    route("senior/flagships",         "routes/senior/flagships/index.tsx"),
    route("senior/flagships/:id",     "routes/senior/flagships/$id/index.tsx"),
    route("senior/reports",           "routes/senior/reports/index.tsx"),
    route("senior/individuals",          "routes/senior/individuals/index.tsx"),
    route("senior/cooperatives",         "routes/senior/cooperatives/index.tsx"),
    route("senior/value-chains",     "routes/senior/value-chains/index.tsx"),
    route("senior/value-chains/add", "routes/senior/value-chains/add.tsx"),
    route("senior/kpis",             "routes/senior/kpis/index.tsx"),
    route("senior/kpis/add",         "routes/senior/kpis/add.tsx"),
    route("senior/agencies",         "routes/senior/agencies/index.tsx"),
    route("senior/agencies/add",     "routes/senior/agencies/add.tsx"),
    route("senior/funders",          "routes/senior/funders/index.tsx"),
    route("senior/funders/add",      "routes/senior/funders/add.tsx"),
  ])

] satisfies RouteConfig;
