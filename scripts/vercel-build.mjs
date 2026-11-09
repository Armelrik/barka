import { spawnSync } from "node:child_process";
function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("npx", ["tsx", "scripts/check-deployment.ts"]);
if (process.env.RUN_DATABASE_MIGRATIONS === "true") {
  if (process.env.VERCEL_ENV !== "production") {
    console.error(
      "Migrations automatiques refusées hors déploiement Production. Utiliser une base Preview séparée et migrer explicitement.",
    );
    process.exit(1);
  }
  run("npx", ["prisma", "migrate", "deploy"]);
}
run("npm", ["run", "build"]);
