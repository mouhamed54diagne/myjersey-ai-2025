import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Sert les fichiers HTML/CSS du dossier public/
app.use(express.static(path.join(__dirname, "public")));

app.post("/generate", async (req, res) => {
  try {
    const { club, prenom, numero } = req.body;

    const OpenAI = (await import("openai")).default;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
      Create a realistic football jersey for club "${club}".
      Name: ${prenom}  
      Number: ${numero}
      No background.
    `;

    const images = [];
    for (let i = 0; i < 3; i++) {
      const result = await client.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      });

      images.push(result.data[0].url);
    }

    res.json({ images });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running on port", PORT));
