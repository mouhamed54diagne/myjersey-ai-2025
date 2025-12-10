class ZoomableImage {
  constructor(container, img) {
    this.container = container
    this.img = img
    this.isZoomed = false

    this.container.addEventListener("click", (e) => {
      if (!this.isZoomed) {
        this.zoomIn(e)
      } else {
        this.zoomOut()
      }
    })
  }

  zoomIn(e) {
    this.isZoomed = true
    this.container.classList.add("zoomed")

    const rect = this.container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    this.img.style.transformOrigin = `${x}% ${y}%`
  }

  zoomOut() {
    this.isZoomed = false
    this.container.classList.remove("zoomed")
    this.img.style.transform = "scale(1)"
  }
}

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault()

  const club = document.getElementById("club").value
  const prenom = document.getElementById("prenom").value.toUpperCase()
  const numero = document.getElementById("numero").value

  const result = document.getElementById("result")
  result.innerHTML = `
    <div class="loading">
      <div class="loading-icon">⚽</div>
      <h3 class="loading-title">Génération en cours</h3>
      <p class="loading-subtitle">${club} • ${prenom} #${numero}</p>
      <p class="loading-time">⏱️ Environ 10-20 secondes</p>
    </div>
  `

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ club, prenom, numero }),
    })

    const data = await response.json()

    if (data.error) {
      result.innerHTML = `
        <div class="error-message">
          <h3 class="error-title">Erreur de génération</h3>
          <p>${data.error}</p>
          ${data.details ? `<small>${data.details}</small>` : ""}
        </div>
      `
      return
    }

    result.innerHTML = `
      <div class="result-header">
        <h2 class="result-title">${data.designs.length} design${data.designs.length > 1 ? "s" : ""} généré${data.designs.length > 1 ? "s" : ""}</h2>
        <p class="result-subtitle">Cliquez sur une image pour zoomer • Téléchargez vos créations</p>
      </div>
      <div class="designs-grid">
        ${data.designs
          .map(
            (design, index) => `
          <div class="design-card">
            <div class="design-number">Design ${index + 1}</div>
            <div class="jersey-viewer" id="viewer-${design.id}">
              <img src="${design.image}" alt="Maillot ${prenom} #${numero}">
            </div>
            <div class="design-actions">
              <a href="${design.image}" download="maillot-${prenom}-${numero}-${index + 1}.jpg" class="btn-download">
                Télécharger
              </a>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
    `

    data.designs.forEach((design) => {
      const container = document.getElementById(`viewer-${design.id}`)
      const img = container.querySelector("img")
      new ZoomableImage(container, img)
    })
  } catch (error) {
    result.innerHTML = `
      <div class="error-message">
        <h3 class="error-title">Erreur réseau</h3>
        <p>Impossible de contacter le serveur</p>
        <small>${error.message}</small>
      </div>
    `
  }
})
