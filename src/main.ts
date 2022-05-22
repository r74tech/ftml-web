import css from './css/wikidot.css';
import sigma from './css/sigma-9.css';
import init from './css/init.css';
import ftmlWorker from './ftml.web.worker.js?bundled-worker&dataurl';

let ftml = new Worker(ftmlWorker, {
  type: 'module',
});

// Workerスレッドから受信
ftml.onmessage = (event: MessageEvent) => {
  document.querySelector("head > style#innercss")!.innerHTML = css;
  document.querySelector("head > style#sigma")!.innerHTML = sigma;
  document.querySelector("head > style#init")!.innerHTML = init;
  const { html, styles } = event.data;

  const previewStyles = document.getElementById('preview-styles')!;
  const previewContent = document.getElementById('preview-content')!;
  previewContent.innerHTML = html;
  previewStyles.innerHTML = styles.map(v => `<style>\n${v.replace(/\\</g, '&lt;')}\n</style>`).join("\n\n");
};

const textareaField = document.getElementById('textarea-content')!;

textareaField.addEventListener('input', (event) => {
  const { target } = event;
  // TextArea要素以外の場合は終了
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  const value = target.value;
  ftml.postMessage(value);
});
