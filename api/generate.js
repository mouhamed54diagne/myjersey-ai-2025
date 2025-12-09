import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/generate", async (req, res) => {
  try {
    const { club, prenom, numero } = req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
      Create a hyper-realistic football jersey design for the club "${club}".
      Print the name "${prenom}" and the number "${numero}" on the back.
      Produce a high-quality 3D render.
      Output ONLY the jersey, no background, no text overlay.
    `;

    const images = [];

    for (let i = 0; i < 3; i++) {
      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024",
      });
      images.push(result.data[0].url);
    }

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
