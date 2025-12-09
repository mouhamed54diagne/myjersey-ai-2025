import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// FICHIERS STATIQUES
// ---------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ---------------------
// FONCTION : Attendre que les images soient prêtes
// ---------------------
async function pollGenerationStatus(generationId, apiKey) {
  const maxAttempts = 30; // 30 tentatives max (30 secondes)
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(
      `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
      {
        headers: { "Authorization": `Bearer ${apiKey}` }
      }
    );
    
    const data = await response.json();
    console.log(`🔄 Tentative ${i + 1}: Status =`, data.generations_by_pk?.status);
    
    if (data.generations_by_pk?.status === "COMPLETE") {
      return data.generations_by_pk.generated_images.map(img => img.url);
    }
    
    // Attendre 1 seconde avant de réessayer
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error("Timeout: La génération a pris trop de temps");
}

// ---------------------
// API GENERATE
// ---------------------
app.post("/api/generate", async (req, res) => {
  
  try {
    console.log("📩 Requête reçue:", req.body);

    const { club, prenom, numero } = req.body;
    const apiKey = process.env.LEONARDO_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "LEONARDO_API_KEY manquante" });
    }

    // Prompt optimisé
    const prompt = `
      Ultra-realistic 3D football jersey for ${club}.
      Back view showing name "${prenom}" and number "${numero}".
      Professional sports photography, studio lighting, 4K quality.
      Clean design, no watermarks.
    `;

    // ÉTAPE 1 : Lancer la génération
    console.log("🎨 Lancement de la génération...");
    const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        modelId: "6bef9f1b-29cb-40c7-b9df-32b51c1f67d3", // Leonardo Phoenix
        prompt: prompt,
        width: 1024,
        height: 1024,
        num_images: 3,
        alchemy: true,
        photoReal: false,
        presetStyle: "DYNAMIC"
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erreur Leonardo:", errorData);
      return res.status(response.status).json({ 
        error: errorData.error || "Erreur API Leonardo" 
      });
    }

    const data = await response.json();
    console.log("📥 Réponse Leonardo:", data);

    const generationId = data.sdGenerationJob?.generationId;
    
    if (!generationId) {
      return res.status(500).json({ 
        error: "Aucun ID de génération reçu",
        details: data
      });
    }

    console.log("🆔 Generation ID:", generationId);

    // ÉTAPE 2 : Attendre que les images soient prêtes
    console.log("⏳ Attente de la génération...");
    const images = await pollGenerationStatus(generationId, apiKey);

    console.log("✅ Images prêtes:", images);
    res.status(200).json({ status: "success", images });

  } catch (error) {
    console.error("❌ Erreur API:", error.message);
    res.status(500).json({ 
      error: "Erreur lors de la génération",
      details: error.message
    });
  }
});

// ---------------------
// LANCEMENT SERVEUR
// ---------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Serveur en cours d'exécution sur le port", PORT);
  console.log(`🌐 Accès: http://localhost:${PORT}`);
});