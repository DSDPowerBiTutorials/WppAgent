/**
 * Import exams catalog from the docx data file.
 * Run: node scripts/import-exams-catalog.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Parse the docx text export (pre-generated)
const DATA_FILE = process.argv[2] || "/tmp/exams-data.json";
const ORG_ID = "00000000-0000-0000-0000-000000000001";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CATEGORY_MAP = {
  "Exames de coleta (Sangue e Urina)": "coleta",
  "Exames de imagem": "imagem",
  "Ginecológicos": "ginecologicos",
  Outros: "outros",
};

async function main() {
  const raw = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  console.log(`Loaded ${raw.length} records`);

  // Deduplicate by name (keep first with most data)
  const seen = new Map();
  for (const r of raw) {
    const key = r.nome.trim().toUpperCase();
    if (!seen.has(key) || (r.preparo && r.preparo !== "Sem preparo específico informado.")) {
      seen.set(key, r);
    }
  }

  const unique = [...seen.values()];
  console.log(`Unique exams: ${unique.length}`);

  const rows = unique.map((r) => {
    const hasMedicalOrder =
      r.pedido_medico?.trim() === "Sim" ||
      r.pedido_medico?.includes("precisa de pedido");
    const medNotes =
      r.pedido_medico &&
      r.pedido_medico !== "Não" &&
      r.pedido_medico !== "Sim"
        ? r.pedido_medico
        : null;
    const prep =
      r.preparo && r.preparo !== "Sem preparo específico informado."
        ? r.preparo
        : null;

    return {
      organization_id: ORG_ID,
      name: r.nome.trim(),
      category: CATEGORY_MAP[r.tipo] || "outros",
      preparation: prep,
      requires_medical_order: hasMedicalOrder,
      medical_order_notes: medNotes,
      active: true,
    };
  });

  // Insert in batches of 50
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase.from("exams_catalog").insert(batch);
    if (error) {
      console.error(`Batch ${i} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${rows.length}`);
    }
  }

  console.log(`Done! ${inserted} exams imported.`);
}

main().catch(console.error);
