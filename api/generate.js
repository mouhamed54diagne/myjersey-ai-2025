import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/generate", async (req, res) => {
  try {
    const { club, prenom, numero } = req.body;

    const prompt = `
      Ultra-realistic 3D football jersey for club "${club}".
      Back print: name "${prenom}", number "${numero}".
      Professional sports jersey design.
      High-quality details, clean, no text overlay, no background.
    `;

    // Appel API Leonardo
    const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.LEONARDO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelId: "b820ea11-02bf-4652-9fc0-49d3c6e875ab", // Leonardo Vision XL
        prompt: prompt,
        width: 1024,
        height: 1024,
        sd_version: "v1",
        num_images: 3 // au lieu d'une seule image
      })
    });

    const data = await response.json();

    if (!data.generations || data.generations.length === 0) {
      return res.status(500).json({ error: "Erreur: aucune image générée." });
    }

    // On récupère toutes les images générées
    const images = data.generations[0].generated_images.map(img => img.url);

    return res.status(200).json({
      status: "success",
      images: images,
    });

  } catch (error) {
    console.error("Erreur génération:", error);
    return res.status(500).json({ error: "Erreur lors de la génération" });
  }
});

// Render écoute sur le port fourni
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

export default app;
