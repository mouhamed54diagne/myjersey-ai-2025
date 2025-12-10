document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const club = document.getElementById("club").value;
  const prenom = document.getElementById("prenom").value.toUpperCase(); // Forcer majuscules
  const numero = document.getElementById("numero").value;

  const result = document.getElementById("result");
  result.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 48px; margin-bottom: 20px;">⚽</div>
      <div style="font-size: 20px; color: #0f62fe;">Génération en cours...</div>
      <div style="font-size: 14px; color: #888; margin-top: 10px;">
        Création de maillots ${club} pour ${prenom} #${numero}
      </div>
      <div style="margin-top: 20px; color: #666;">
        ⏱️ Cela peut prendre 10-20 secondes
      </div>
    </div>
  `;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ club, prenom, numero })
    });

    const data = await response.json();

    if (data.error) {
      result.innerHTML = `
        <div style="padding: 30px; background: #ff4444; border-radius: 10px; color: white;">
          <h3>❌ Erreur</h3>
          <p>${data.error}</p>
          ${data.details ? `<small style="opacity: 0.8;">${data.details}</small>` : ''}
        </div>
      `;
      return;
    }

    // Afficher les images avec style amélioré
    result.innerHTML = `
      <h2 style="color: #0f62fe; margin: 30px 0;">
        ✅ ${data.images.length} maillots générés pour ${prenom} #${numero}
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
        ${data.images.map((url, index) => `
          <div style="background: #1a1a1a; padding: 15px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
            <img src="${url}" alt="Maillot ${index + 1}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #888; font-size: 14px;">Variante ${index + 1}</span>
              <a href="${url}" download="maillot-${prenom}-${numero}-${index + 1}.jpg" 
                 style="background: #0f62fe; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 13px;">
                📥 Télécharger
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;

  } catch (error) {
    result.innerHTML = `
      <div style="padding: 30px; background: #ff4444; border-radius: 10px; color: white;">
        <h3>❌ Erreur réseau</h3>
        <p>Impossible de contacter le serveur</p>
        <small>${error.message}</small>
      </div>
    `;
  }
});