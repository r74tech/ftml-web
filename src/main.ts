import css from './css/wikidot.css';
import init from './css/init.css';
import Worker from "./bundle.js?worker";
const ftmlWorker = new Worker();

// Workerスレッドから受信
ftmlWorker.onmessage = (event: MessageEvent) => {
  document.querySelector("head > style#innercss")!.innerHTML = css;
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
  ftmlWorker.postMessage(value);
});
