let ftml = require("@vscode-ftml/ftml-wasm");
ftml.init();
onmessage = async (e) => {
  if (!ftml.ready) await ftml.loading;
  const ftmlSource = e.data.value;

  const { html, styles } = ftml.renderHTML(ftmlSource);
  const type = e.data.type;
  postMessage({ html, styles, type });
}