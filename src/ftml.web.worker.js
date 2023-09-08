// import * as ftml from "@vscode-ftml/ftml-wasm";
import * as ftml from "../lib/ftml-wasm";

ftml.init();
onmessage = async (e) => {
  if (!ftml.ready) await ftml.loading;
  const ftmlSource = e.data.value;

  const { html, meta, styles, backlinks } = ftml.renderHTML(ftmlSource);
  postMessage({ html, meta, styles, backlinks });
}