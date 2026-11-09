import "dotenv/config";
import { deploymentProblems } from "../src/modules/deployment/config";
const errors = deploymentProblems(process.env);
if (errors.length) {
  console.error("Configuration hébergée incomplète :");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else
  console.info(
    "Configuration de déploiement valide. Les valeurs secrètes ne sont pas affichées. Ce contrôle ne vérifie pas l’accès au bucket ni à la base.",
  );
