import express from "express"
import cors from "cors"
import fetch from "node-fetch"
import path from "path"
import { fileURLToPath } from "url"

const app = express()
app.use(cors())
app.use(express.json())

// ---------------------
// FICHIERS STATIQUES
// ---------------------
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.static(path.join(__dirname, "../public")))

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"))
})

// ---------------------
// FONCTION : Attendre que les images soient prêtes
// ---------------------
async function pollGenerationStatus(generationId, apiKey) {
  const maxAttempts = 20

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    const data = await response.json()
    console.log(`🔄 Tentative ${i + 1}: Status =`, data.generations_by_pk?.status)

    if (data.generations_by_pk?.status === "COMPLETE") {
      return data.generations_by_pk.generated_images.map((img) => img.url)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error("Timeout: La génération a pris trop de temps")
}

// ---------------------
// API GENERATE
// ---------------------
app.post("/api/generate", async (req, res) => {
  try {
    console.log("📩 Requête reçue:", req.body)

    const { club, prenom, numero } = req.body
    const apiKey = process.env.LEONARDO_API_KEY

    if (!apiKey) {
      console.error("❌ LEONARDO_API_KEY manquante !")
      return res.status(500).json({
        error: "Clé API non configurée. Ajoute LEONARDO_API_KEY dans les variables d'environnement.",
      })
    }

    console.log("✅ Clé API trouvée:", apiKey.substring(0, 10) + "...")

    const prompt = `
Hyper-realistic professional ${club} football jersey floating in pure white void, no background, no hanger, no lighting equipment, just the jersey alone.
Premium championship edition design with revolutionary patterns and textures that surpass Adidas quality.
Front view: Official ${club} colors with innovative geometric patterns, holographic details, premium embossed textures, ultra-modern cut, club crest with metallic finish, avant-garde design elements.
Back view: Bold "${prenom.toUpperCase()}" in futuristic 3D embossed typography, massive number "${numero}" with chrome or rose gold gradient effects, sharp laser-cut edges.
Jersey appears suspended in space against pure white infinity, no shadows, no hangers, no bars, no studio equipment visible.
12K ultra-high resolution, photo-realistic fabric with micro-details, visible thread texture, championship-level craftsmanship exceeding Nike and Adidas standards.
Cutting-edge sportswear design, museum-quality product shot, award-winning sports photography.
Name MUST be: ${prenom.toUpperCase()}
Number MUST be: ${numero}
    `.trim()

    // ÉTAPE 1 : Lancer la génération
    console.log("🎨 Lancement de la génération...")
    const response = await fetch("https://cloud.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelId: "6b645e3a-d64f-4341-a6d8-7a3690fbf042",
        prompt: prompt,
        negative_prompt:
          "hanger, bar, hook, studio lights, lighting equipment, shadows, mannequin, person, model, stand, rack, background patterns, watermark, blurry, low quality, distorted text, misspelled names, wrong numbers, cartoon, 3d render, illustration, wrinkled, dirty, damaged, amateur, cheap, pixelated",
        width: 1024,
        height: 1024,
        num_images: 1,
        alchemy: true,
        presetStyle: "PHOTOGRAPHY",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erreur Leonardo:", errorData)
      return res.status(response.status).json({
        error: errorData.error || "Erreur API Leonardo",
      })
    }

    const data = await response.json()
    console.log("📥 Réponse Leonardo:", data)

    const generationId = data.sdGenerationJob?.generationId

    if (!generationId) {
      return res.status(500).json({
        error: "Aucun ID de génération reçu",
        details: data,
      })
    }

    console.log("🆔 Generation ID:", generationId)

    // ÉTAPE 2 : Attendre que les images soient prêtes
    console.log("⏳ Attente de la génération...")
    const images = await pollGenerationStatus(generationId, apiKey)

    console.log("✅ Images prêtes:", images)

    const designs = images.map((url, index) => ({
      id: `design-${Date.now()}-${index}`,
      image: url,
    }))

    res.status(200).json({ status: "success", designs })
  } catch (error) {
    console.error("❌ Erreur API:", error.message)
    res.status(500).json({
      error: "Erreur lors de la génération",
      details: error.message,
    })
  }
})

// ---------------------
// LANCEMENT SERVEUR
// ---------------------
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("🚀 Serveur en cours d'exécution sur le port", PORT)
  console.log(`🌐 Accès: http://localhost:${PORT}`)
})
