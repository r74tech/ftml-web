import { init, renderHTML, ready, loading } from './lib/ftml-wasm/esm/wj-ftml-wasm.esm.js';

init();
onmessage = async (e) => {
  if (!ready) await loading;
  const ftmlSource = e.data.value;

  const { html, styles = [] } = renderHTML(ftmlSource);
  const type = e.data.type;
  postMessage({ html, styles, type });
};
