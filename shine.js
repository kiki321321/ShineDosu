// Compatibility loader. The app is now split into index.html + app.js + style.css.
(() => {
  const script = document.createElement("script");
  script.src = "app.js";
  document.head.appendChild(script);
})();
