import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import app from "./server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, "../.env") });

const port = Number(process.env.PORT || 3333);
app.listen(port, () => console.log(`[user-service] listening on ${port}`));
