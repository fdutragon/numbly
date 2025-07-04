import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    compilerOptions: {
      target: "ESNext",
      lib: ["DOM", "DOM.Iterable", "ESNext"],
      module: "ESNext",
      moduleResolution: "Bundler",
      resolveJsonModule: true,
      esModuleInterop: true,
      isolatedModules: true,
      allowJs: true,
      skipLibCheck: true,
      strict: false,
      noImplicitAny: false,
      forceConsistentCasingInFileNames: false,
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
    exclude: ["node_modules"],
  },
];

export default eslintConfig;
