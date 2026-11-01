// Renombres personalizados de canales: { "id-del-canal": "Nombre nuevo" }
// - En la app: botón ✏️ Renombrar junto al reproductor (se guarda también en localStorage).
// - En el pipeline (scripts/actualizar.sh) este archivo NO se regenera: se aplica sobre
//   playlists/tv-chile-todo.m3u con scripts/aplicar_renames.py, así los nombres propios
//   sobreviven a las actualizaciones automáticas. El número (tvg-chno/tvg-id) no cambia.
window.RENAMES = {};
