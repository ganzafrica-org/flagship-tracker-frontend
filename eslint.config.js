import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import checkFile from "eslint-plugin-check-file";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tseslint,
      "check-file": checkFile,
    },
    languageOptions: {
      parser: tsparser,
    },
    rules: {
      // Filenames must be kebab-case (e.g. stat-card.tsx, query-client.ts)
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{ts,tsx}": "KEBAB_CASE",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],

      // Naming conventions:
      // - variables: camelCase only
      // - functions: camelCase for utilities/hooks, PascalCase for React components
      // - parameters: camelCase (leading underscore allowed for unused params)
      // - types/interfaces/enums: PascalCase
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],

      // Enforce double quotes
      quotes: ["error", "double"],
    },
  },
];
