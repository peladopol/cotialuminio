import { Router } from "express";
import multer from "multer";
import { getDB, setDB } from "./db/store";
import { importCostDBFromExcel } from "./db/excelImport";
import { cotizar } from "./domain/calc";
import { QuoteInput } from "./domain/types";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
export const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));
router.get("/admin/prices", (_req, res) => res.json(getDB()));

// Catálogo para el widget: solo IDs existentes en el Excel cargado
router.get("/catalog/vidrios", (_req, res) => {
  const db = getDB();
  const items = db.vidrios
    .filter(v => !!v.id)
    .map(v => ({ id: v.id, label: v.tipo === "DVH" ? `DVH ${v.configuracion || v.id}` : (v.configuracion || v.id), tipo: v.tipo }));
  res.json({ items });
});

router.post("/admin/upload-excel", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Falta archivo" });
  try {
    const db = importCostDBFromExcel(req.file.buffer);
    setDB(db);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || String(e) });
  }
});

router.post("/quote", (req, res) => {
  try {
    const input = req.body as QuoteInput;
    const out = cotizar(getDB(), input);
    res.json(out);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || String(e) });
  }
});
