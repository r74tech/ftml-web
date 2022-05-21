const _worker: Worker = self as any;
let ftml = require("@wikijump/ftml-wasm");
ftml.init();
_worker.onmessage  = async (e) => {
  if (!ftml.ready) await ftml.loading;
  const ftmlSource = e.data;

  const { html, styles } = ftml.renderHTML(ftmlSource);

  // sending message back to main thread
  _worker.postMessage({ html, styles });
}


