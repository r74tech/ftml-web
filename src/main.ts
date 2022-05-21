import css from './css/wikidot.css';
// import  MyWorker from "/src/worker?worker";
const ftmlWorker = new Worker("/src/bundle.js");
// import ftmlWorker from '/src/bundle.js?bundled-worker&dataurl';

// const worker = new MyWorker();

// import { setListeners } from "./listeners";


// Workerスレッドから受信
ftmlWorker.onmessage = (event: MessageEvent) => {
  console.log(event.data);
};

// Workerスレッドへ送信
ftmlWorker.postMessage(`[[=]]
Apple
[[/=]]`);

/**
 * Generates a tab title for the preview.
 * @param fileName Name of source file for the preview.
 * @param backend The backend to be used.
 * @param live The preview being live or not.
 * @param lock The preview being locked to a file or not.
 */
 function genTitle(fileName: string, backend: string, live: boolean, lock: boolean) {
  let prefix = backend=="ftml" && live ? `Live ${backend}` : backend;
  prefix = lock ? `[${prefix}]` : prefix;
  return `${prefix} ${fileName}`;
}






/**
 * Generates an HTML body for the preview.
 */
 function genHtml() {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wikitext Preview</title>
    <style>
    ${css}
    </style>
  </head>
  <body>
  <div id="preview-styles"></div>
  <div id="preview-content">loading...</div>
  <script>

    const ftmlWorker = ${JSON.stringify(ftmlWorker)};
    const previewStyles = document.getElementById('preview-styles');
    const previewContent = document.getElementById('preview-content');
    
    let ftml = new Worker(ftmlWorker, {
      type: 'module',
    });
  
    ftml.addEventListener('message', e => {
      const { html, styles } = e.data;
      previewContent.innerHTML = html;
      previewStyles.innerHTML = styles.map(v=>\`<style>\\n\${v.replace(/\\</g, '&lt;')}\\n</style>\`).join("\\n\\n");
      state.content = html;
      state.styles = previewStyles.innerHTML;
      vscode.setState(state);
    });  
    </script>
  </body>
  </html>`
}

document.addEventListener("DOMContentLoaded", function() {
  let html = document.querySelector("html");
  html.innerHTML = genHtml();
});

export type {
  genTitle,
  genHtml,
};