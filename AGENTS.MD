You have access to the full repository in a sandbox environment.

Please run the project's lint task and automatically fix all issues.

Steps:
1. Run: npm install
2. Run: npx eslint . --ext .js,.jsx,.ts,.tsx --fix
3. Apply all safe auto-fixes automatically.
4. Do not stop on individual file errors.
5. Skip folders like node_modules, .next, build, dist.
6. Use the ESLint config defined in .eslintrc.js at the root.

At the end, provide a summary:
- Number of files scanned
- Number of files modified
- List of remaining unfixable errors (with file, line, and rule name)

Do not ask questions. Just execute everything directly.
