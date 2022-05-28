import css from './css/wikidot.css';
import init from './css/init.css';
import collapsible from './css/collapsible.css';
import YAML from 'yaml'
import { debounce } from "ts-debounce";
import { throttle } from 'throttle-typescript';
import ftmlWorker from './ftml.web.worker.js?bundled-worker&dataurl';

let ftml = new Worker(ftmlWorker, {
  type: 'module',
});

document.querySelector("head > style#innercss")!.innerHTML = css;
document.querySelector("head > style#collapsible")!.innerHTML = collapsible;
document.querySelector("head > style#init")!.innerHTML = init;

// Workerスレッドから受信
ftml.onmessage = (event: MessageEvent) => {
  const { html, styles, type } = event.data;
  const pageStyles = document.getElementById('page-styles')!;
  const pageContent = document.getElementById('page-content')!;
  const sideContent = document.getElementById('side-bar')!;
  const topContent = document.getElementById('top-bar')!;
  if (type == 'page') {
    pageContent.innerHTML = html.replace("\<wj-body class=\"wj-body\"\>", "").replace("\<\/wj-body\>", "");
  } else if (type == 'side') {
    sideContent.innerHTML = html.replace("\<wj-body class=\"wj-body\"\>", "").replace("\<\/wj-body\>", "");
  } else if (type == 'top') {
    topContent.innerHTML = html.replace("\<wj-body class=\"wj-body\"\>", "").replace("\<\/wj-body\>", "");
  } else {
    pageContent.innerHTML = html.replace("\<wj-body class=\"wj-body\"\>", "").replace("\<\/wj-body\>", "");
  }
  if (styles.length > 0) {
    pageStyles.innerHTML = styles.map((v: string) => `<style>\n${v.replace(/\\</g, '&lt;')}\n</style>`).join("\n\n");
  } else {
    pageStyles.innerHTML = "";
  }
};

async function loadlocales(lang: string = 'en') {
  const sideftml = await fetch(`./locales/${lang}/side.ftml`).then(v => v.text());
  const topftml = await fetch(`./locales/${lang}/top.ftml`).then(v => v.text());
  const theme = await fetch(`./locales/${lang}/theme.css`).then(v => v.text());
  const messages = YAML.parse(await fetch(`./locales/${lang}/messages.yaml`).then(v => v.text()));
  for (const key in messages.actionarea) {
    let messagevalue = messages.actionarea[key];
    if (Array.isArray(messagevalue)) {
      const message = messagevalue.map((v: string) => `<li>${v}</li>`).join("");
      document.querySelector(`#actionarea-${key}`)!.innerHTML = message;
    }
    else if (key == "save") {
      document.querySelector(`#actionarea-${key}`)!.value = messagevalue;
    }
    else {
      document.querySelector(`#actionarea-${key}`)!.innerHTML = messagevalue;
    }
  }
  readlang(lang);
  document.querySelector("head > style#theme")!.innerHTML = theme;
  ftml.postMessage({ value: sideftml, type: "side" });
  ftml.postMessage({ value: topftml, type: "top" });
}
async function readlang(lang: string) {
  document.getElementById("lang-select")!.innerHTML = "";
  const langconfig = YAML.parse(await fetch('./locales/index.yaml').then(v => v.text()));
  for (const key in langconfig[lang]) {
    let op = document.createElement("option");
    op.value = key;
    op.label = langconfig[lang][key];
    op.text = langconfig[lang][key];
    if (key == lang)
      op.selected = true;
    document.getElementById("lang-select")!.appendChild(op);
  }
}

const editpageField: HTMLInputElement = <HTMLInputElement>document.getElementById('edit-page-textarea')!;
const edittitleField: HTMLInputElement = <HTMLInputElement>document.getElementById('edit-page-title')!;
const editsideField: HTMLInputElement = <HTMLInputElement>document.getElementById('edit-side-textarea')!;
const editsaveButton: HTMLInputElement = <HTMLInputElement>document.getElementById('actionarea-save')!;
const langSelect: HTMLInputElement = <HTMLInputElement>document.getElementById('lang-select')!;

editpageField.addEventListener('input', debounce((event) => {
    const { target } = event;
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }
    const value = target.value;
    const type = "page"
    const FtmlStorageItem = { title: edittitleField.value, page: editpageField.value, side: editsideField.value };
    localStorage.setItem("FtmlStorage", JSON.stringify(FtmlStorageItem));
    ftml.postMessage({ value: value, type: type });
}, 1000));

editsideField.addEventListener('input', debounce((event) => {
  const { target } = event;
  if (!(target instanceof HTMLTextAreaElement)) {
    return;
  }
  const value = target.value;
  const type = "side"
  const FtmlStorageItem = { title: edittitleField.value, page: editpageField.value, side: editsideField.value };
  localStorage.setItem("FtmlStorage", JSON.stringify(FtmlStorageItem));
  ftml.postMessage({ value: value, type: type });
}, 1000));

edittitleField.addEventListener('input', (event) => {
  const { target } = event;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }
  const value = target.value;
  document.querySelector("#page-title")!.innerHTML = value;
  const FtmlStorageItem = { title: edittitleField.value, page: editpageField.value, side: editsideField.value };
  localStorage.setItem("FtmlStorage", JSON.stringify(FtmlStorageItem));
});

langSelect.addEventListener('change', function () {
  const lang = this.value;
  loadlocales(lang);
  const WPconfigItem = { lang: lang };
  localStorage.setItem("WPconfig", JSON.stringify(WPconfigItem));

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
  const WPconfigItem = localStorage.getItem("WPconfig");
  if (WPconfigItem) {
    const WPconfig = JSON.parse(WPconfigItem);
    loadlocales(WPconfig.lang);
  } else {
    loadlocales();
  }
  const FtmlStorageItem = localStorage.getItem("FtmlStorage");
  if (FtmlStorageItem) {
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
  const FtmlStrageItem = localStorage.getItem("FtmlStrage");
  if (FtmlStrageItem) {
    localStorage.removeItem("FtmlStrage");
  }
});
