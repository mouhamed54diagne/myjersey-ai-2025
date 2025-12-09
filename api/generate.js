import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// Fichiers statiques
// ---------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ---------------------
// API GENERATE
// ---------------------
app.post("/api/generate", async (req, res) => {

  // 🌟 TEST 1 — vérifier que la route est bien appelée
  console.log("🔥 API /api/generate appelée !");
  console.log("📩 Données reçues du front :", req.body);

  // 🌟 TEST 2 — vérifier que Render lit la clé API
  console.log("🔑 Clé API Leonardo détectée ?", !!process.env.LEONARDO_API_KEY);

  try {
    const { club, prenom, numero } = req.body;

    const prompt = `
      Ultra-realistic 3D football jersey for club "${club}".
      Back print: name "${prenom}", number "${numero}".
      Professional sports jersey design.
      High-quality details, clean, no text overlay, no background.
    `;

    // 🌟 TEST 3 — log avant d’appeler Leonardo
    console.log("🚀 Envoi de la requête à Leonardo...");

    const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LEONARDO_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        modelId: "b820ea11-02bf-4652-9fc0-49d3c6e875ab",
        prompt,
        width: 1024,
        height: 1024,
        sd_version: "v1",
        num_images: 3
      })
    });

    const data = await response.json();

    // 🌟 TEST 4 — voir ce que Leonardo renvoie
    console.log("📥 Réponse Leonardo :", data);

    if (!data.generations) {
      return res.status(500).json({ error: "Aucune image générée." });
    }

    const images = data.generations[0].generated_images.map(img => img.url);

    res.status(200).json({ status: "success", images });

  } catch (error) {
    // 🌟 TEST 5 — log de l’erreur si Leonardo plante
    console.error("❌ Erreur API :", error);
    res.status(500).json({ error: "Erreur lors de la génération" });
  }
});

// ---------------------
// Lancement du serveur
// ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Serveur en cours d'exécution sur le port", PORT);
});
