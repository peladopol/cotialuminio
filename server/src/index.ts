import express from "express";
import cors from "cors";
import { router } from "./routes";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/api", router);

const port = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(port, () => console.log(`Cotizador API en http://localhost:${port}`));
