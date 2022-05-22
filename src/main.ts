import css from './css/wikidot.css';
import sigma from './css/sigma-9.css';
import init from './css/init.css';
import font from './css/font-bauhaus.css';
import ftmlWorker from './ftml.web.worker.js?bundled-worker&dataurl';

let ftml = new Worker(ftmlWorker, {
  type: 'module',
});

document.querySelector("head > style#innercss")!.innerHTML = css;
document.querySelector("head > style#sigma")!.innerHTML = sigma;
document.querySelector("head > style#init")!.innerHTML = init;
document.querySelector("head > style#font")!.innerHTML = font;

// Workerスレッドから受信
ftml.onmessage = (event: MessageEvent) => {
  const { html, styles, type } = event.data;

  const pageStyles = document.getElementById('page-styles')!;
  const pageContent = document.getElementById('page-content')!;
  const sideContent = document.getElementById('side-bar')!;
  if (type == 'page') {
    pageContent.innerHTML = html;
  } else if (type == 'side') {
    sideContent.innerHTML = html;
  } else {
    pageContent.innerHTML = html;
  }
  if (styles.length > 0) {
    pageStyles.innerHTML = styles.map(v => `<style>\n${v.replace(/\\</g, '&lt;')}\n</style>`).join("\n\n");
  }
};

const editpageField = document.getElementById('edit-page-textarea')!;
const edittitleField = document.getElementById('edit-page-title')!;
const editsideField = document.getElementById('edit-side-textarea')!;
const editsaveButton = document.getElementById('edit-save-button')!;

editpageField.addEventListener('input', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  const value = target.value;
  const type = "page"
  ftml.postMessage({ value: value, type: type });
});

editsideField.addEventListener('input', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  const value = target.value;
  const type = "side"
  ftml.postMessage({ value: value, type: type });
});

edittitleField.addEventListener('input', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  const value = target.value;
  document.querySelector("#page-title")!.innerHTML = value;
});

editsaveButton.addEventListener('click', async () => {
  const opts = {
    suggestedName: edittitleField.value ? edittitleField.value : 'underfined',
    types: [{
      description: 'Foundation Text Markup Language',
      accept: { 'text/plain': ['.ftml'] },
    }],
  };
  try {
    const handle = await window.showSaveFilePicker(opts);
    const writable = await handle.createWritable();
    await writable.write(editpageField.value);
    await writable.close();
  } catch (err) {
    console.log(err)
  }
})

