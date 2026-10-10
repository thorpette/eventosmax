import { loadConfig } from "./infrastructure/config.js";
import { createRepositories } from "./infrastructure/persistence/repositories.js";
import { createApp } from "./interfaces/http/app.js";

const config = loadConfig();
const repos = createRepositories(config.databasePath);
const app = createApp(config, repos);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`PassLive API escuchando en http://localhost:${config.port}`);
});
