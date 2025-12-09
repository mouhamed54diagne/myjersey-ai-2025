import OpenAI from "openai";

export default async function handler(req, res) {
  try {
    const { club, prenom, numero } = req.body;

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prompt pour générer un maillot réaliste (3 vues)
    const prompt = `
      Create a hyper-realistic football jersey design for the club "${club}".
      Print the name "${prenom}" and the number "${numero}" on the back.
      Produce a high-quality 3D render.
      Output ONLY the jersey, no background, no text overlay.
    `;

    // On génère 3 images : face / arrière / zoom
    const images = [];
    for (let i = 0; i < 3; i++) {
      const result = await client.images.generate({
        model: "gpt-image-1", // modèle OpenAI gratuit
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
}

