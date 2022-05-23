import css from './css/wikidot.css';
import sigma from './css/sigma-9.css';
import init from './css/init.css';
import ftmlWorker from './ftml.web.worker.js?bundled-worker&dataurl';


type FtmlStorage = { title: string, page: string, side: string};

let ftml = new Worker(ftmlWorker, {
  type: 'module',
});

document.querySelector("head > style#innercss")!.innerHTML = css;
document.querySelector("head > style#sigma")!.innerHTML = sigma;
document.querySelector("head > style#init")!.innerHTML = init;

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
  }  else if (type == 'top') {
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
  const FtmlStorageItem = { title: edittitleField.value, page: editpageField.value, side: editsideField.value};
  localStorage.setItem("FtmlStorage", JSON.stringify(FtmlStorageItem));
  ftml.postMessage({ value: value, type: type });
});

editsideField.addEventListener('input', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  const value = target.value;
  const type = "side"
  const FtmlStorageItem = { title: edittitleField.value, page: editpageField.value, side: editsideField.value};
  localStorage.setItem("FtmlStorage", JSON.stringify(FtmlStorageItem));
  ftml.postMessage({ value: value, type: type });
});

edittitleField.addEventListener('input', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  const value = target.value;
  document.querySelector("#page-title")!.innerHTML = value;
  const FtmlStorageItem = { title: edittitleField.value, page: editpageField.value, side: editsideField.value};
  localStorage.setItem("FtmlStorage", JSON.stringify(FtmlStorageItem));
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


document.addEventListener('DOMContentLoaded', () => {
    const FtmlStorageItem = localStorage.getItem("FtmlStorage");
  if (FtmlStorageItem){
    const FtmlStorage = JSON.parse(FtmlStorageItem);
    edittitleField.value = FtmlStorage.title;
    editpageField.value = FtmlStorage.page;
    editsideField.value = FtmlStorage.side;
    if (FtmlStorage.page) {
      const type = "page"
      ftml.postMessage({ value: FtmlStorage.page, type: type });
    }
    if (FtmlStorage.side) {
      const type = "side"
      ftml.postMessage({ value: FtmlStorage.side, type: type });
    }
    if (FtmlStorage.title) {
      document.querySelector("#page-title")!.innerHTML = FtmlStorage.title;
    }
  }
});