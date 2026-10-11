import { config } from 'dotenv';
import { reviewConfiguration } from './configuration-readiness.mjs';
config({ quiet: true });
if (process.argv.length > 2) {
  console.error(JSON.stringify({ error: 'This command accepts no arguments. Supply configuration through environment variables or .env.' }));
  process.exitCode = 1;
} else {
  const report = reviewConfiguration(process.env);
  console.log(JSON.stringify(report, null, 2));
  if (!report.configurationValid) process.exitCode = 1;
}
