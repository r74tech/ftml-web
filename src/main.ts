import '@/../resources/css/main.scss';
import '@wikijump/ftml-components/src/index.ts';
import css from './css/wikidot.css';
import init from './css/init.css';
import collapsible from './css/collapsible.css';
import YAML from 'yaml';
import { debounce } from 'ts-debounce';
import shortid from 'shortid';
import ftmlWorker from './ftml.web.worker.js?bundled-worker&dataurl';

const ftml = new Worker(ftmlWorker, {
  type: 'module',
});

const setInnerHtml = (element, content) => {
  if (element) {
    element.innerHTML = content;
  }
};

const handleMessage = (event) => {
  const { html, styles, type } = event.data;
  const contentMapping = {
    page: 'page-content',
    side: 'side-bar',
    top: 'top-bar',
  };
  const targetContent = document.getElementById(contentMapping[type]) || document.getElementById('page-content');
  const cleanedHtml = html.replace(/<wj-body class="wj-body">/g, '').replace(/<\/wj-body>/g, '');

  setInnerHtml(targetContent, cleanedHtml);

  const pageStyles = document.getElementById('page-styles');
  if (pageStyles) {
    setInnerHtml(
      pageStyles,
      styles.map((v) => `<style>\n${v.replace(/</g, '&lt;')}\n</style>`).join('\n\n')
    );
  }
};


const editpageField = document.getElementById('edit-page-textarea');
const edittitleField = document.getElementById('edit-page-title');
const editsideField = document.getElementById('edit-side-textarea');
const editsaveButton = document.getElementById('actionarea-save');
const shareButton = document.getElementById('actionarea-share');
const langSelect = document.getElementById('lang-select');

document.querySelector("head > style#innercss")!.innerHTML = css;
document.querySelector("head > style#collapsible")!.innerHTML = collapsible;
document.querySelector("head > style#init")!.innerHTML = init;

ftml.onmessage = handleMessage;

const loadlocales = async (lang = 'en') => {
  const fetchText = async (url) => {
    const response = await fetch(url);
    return response.text();
  };

  const [sideftml, topftml, theme, messagesYaml] = await Promise.all([
    fetchText(`/locales/${lang}/side.ftml`),
    fetchText(`/locales/${lang}/top.ftml`),
    fetchText(`/locales/${lang}/theme.css`),
    fetchText(`/locales/${lang}/messages.yaml`),
  ]);

  const messages = YAML.parse(messagesYaml);

  for (const key in messages.actionarea) {
    const messageValue = messages.actionarea[key];
    const actionareaElement = document.querySelector(`#actionarea-${key}`);
    if (!actionareaElement) continue;

    if (Array.isArray(messageValue)) {
      const messageHtml = messageValue.map((v) => `<li>${v}</li>`).join('');
      setInnerHtml(actionareaElement, messageHtml);
    } else if (key === 'save') {
      actionareaElement.value = messageValue;
    } else {
      setInnerHtml(actionareaElement, messageValue);
    }
  }

  readlang(lang);
  setInnerHtml(document.querySelector("head > style#theme"), theme);
  ftml.postMessage({ value: sideftml, type: 'side' });
  ftml.postMessage({ value: topftml, type: 'top' });
};

const readlang = async (lang) => {
  const langSelect = document.getElementById('lang-select');
  if (!langSelect) return;

  langSelect.innerHTML = '';
  const langConfigYaml = await fetch('/locales/index.yaml').then((response) => response.text());
  const langConfig = YAML.parse(langConfigYaml);

  for (const key in langConfig.lang) {
    const option = document.createElement('option');
    option.value = key;
    option.label = langConfig.lang[key];
    option.text = langConfig.lang[key];
    if (key === lang) option.selected = true;
    langSelect.appendChild(option);
  }
};


const generateShortId = () => {
  // Implement your short ID generation logic here
  // Return the generated short ID
  return shortid.generate();
};

// Event Handlers
const handleEditpageInput = debounce((event) => {
  const { target } = event;
  if (!(target instanceof HTMLTextAreaElement)) return;

  const value = target.value;
  const type = "page";
  const shortid = getCurrentShortId();

  const FtmlStorageItem = {
    title: edittitleField.value,
    page: editpageField.value,
    side: editsideField.value
  };

  const storageKey = shortid ? `FtmlStorage[${shortid}]` : 'FtmlStorage';
  localStorage.setItem(storageKey, JSON.stringify(FtmlStorageItem));

  ftml.postMessage({ value, type });

}, 1000);

const handleEditsideInput = debounce((event) => {
  const { target } = event;
  if (!(target instanceof HTMLTextAreaElement)) return;

  const value = target.value;
  const type = "side";
  const shortid = getCurrentShortId();

  const FtmlStorageItem = {
    title: edittitleField.value,
    page: editpageField.value,
    side: editsideField.value
  };

  const storageKey = shortid ? `FtmlStorage[${shortid}]` : 'FtmlStorage';
  localStorage.setItem(storageKey, JSON.stringify(FtmlStorageItem));

  ftml.postMessage({ value, type });

}, 1000);

const handleEdittitleInput = (event) => {
  const { target } = event;
  if (!(target instanceof HTMLInputElement)) return;

  const value = target.value;
  const pageTitle = document.querySelector("#page-title");
  if (pageTitle) pageTitle.innerHTML = value;
  const shortid = getCurrentShortId();

  const FtmlStorageItem = {
    title: edittitleField.value,
    page: editpageField.value,
    side: editsideField.value
  };
  const storageKey = shortid ? `FtmlStorage[${shortid}]` : 'FtmlStorage';
  localStorage.setItem(storageKey, JSON.stringify(FtmlStorageItem));
};

const handleLangSelectChange = function () {
  const lang = this.value;
  loadlocales(lang);
  const WPconfigItem = { lang };
  localStorage.setItem("WPconfig", JSON.stringify(WPconfigItem));
};

const handleEditsaveButtonClick = async () => {
  const opts = {
    suggestedName: edittitleField.value || 'undefined',
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
    console.log(err);
  }
};


// 共有ボタンを押したときの処理
const handleShareButtonClick = async () => {
  const shortId = getCurrentShortId() || generateShortId();
  const dataToSend = {
    shortid: shortId,
    title: edittitleField.value,
    source: `'${editpageField.value}` // Add a newline at the end of the source
  };

  console.debug('Sending data to GAS:', dataToSend);

  try {
    const response = await postDataToGAS(dataToSend);
    if (response.error) {
      console.error('Error sending data to GAS:', response.error);
    } else {
      window.location.href = `/share/${shortId}`;
    }
  } catch (error) {
    console.error('Error sending data to GAS:', error);
  }
};




// ローカルストレージからデータを読み込んで表示する関数
const displayLocalStorageData = (itemName = "FtmlStorage") => {
  const FtmlStorageItem = localStorage.getItem(itemName);
  if (FtmlStorageItem) {
    const FtmlStorage = JSON.parse(FtmlStorageItem);
    edittitleField.value = FtmlStorage.title;
    editpageField.value = FtmlStorage.page;
    editsideField.value = FtmlStorage.side;

    if (FtmlStorage.page) {
      ftml.postMessage({ value: FtmlStorage.page, type: "page" });
    }

    if (FtmlStorage.side) {
      ftml.postMessage({ value: FtmlStorage.side, type: "side" });
    }

    if (FtmlStorage.title) {
      const pageTitle = document.querySelector("#page-title");
      if (pageTitle) pageTitle.innerHTML = FtmlStorage.title;
    }
  }
};

const displayData = (data) => {
  console.log(data);
  edittitleField.value = data.title;
  editpageField.value = data.source;
  editsideField.value = ''; // Assuming there's no side in this data structure.

  if (data.source) {
    ftml.postMessage({ value: data.source, type: "page" });
  }

  if (data.title) {
    const pageTitle = document.querySelector("#page-title");
    if (pageTitle) pageTitle.innerHTML = data.title;
  }
};



const handleDOMContentLoaded = async () => {
  const WPconfigItem = localStorage.getItem("WPconfig");
  if (WPconfigItem) {
    const WPconfig = JSON.parse(WPconfigItem);
    loadlocales(WPconfig.lang);
  } else {
    loadlocales();
  }

  const url = new URL(window.location.href);
  const pathname = url.pathname;
  const pathParts = pathname.split('/').filter(part => part); // 空の要素を除外

  if (pathParts.length === 2 && pathParts[0] === 'share') {
    const shortid = pathParts[1]; // shortId を取得
    try {
      const data = await getDataFromGAS(shortid); // 適切な関数名に修正
      if (data.error) {
        displayLocalStorageData(`FtmlStorage[${shortid}]`)
      } else {
        displayData(data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      displayLocalStorageData(`FtmlStorage[${shortid}]`)
    }
  } else {
    displayLocalStorageData();
  }
};


async function getDataFromGAS(shortId) {
  const apiUrl = `https://script.google.com/macros/s/AKfycbxZUHdkLbrd6OtbCLEgBRqcd8gi3qmEQg7fmxewaOMCEu9skF9xoTj3pRJ1cx7kP-hofQ/exec?shortid=${shortId}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from GAS. Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data from GAS:', error);
    return { error: 'Failed to fetch data from GAS' };
  }
}


const postDataToGAS = async (data) => {
  const url = 'https://script.google.com/macros/s/AKfycbxZUHdkLbrd6OtbCLEgBRqcd8gi3qmEQg7fmxewaOMCEu9skF9xoTj3pRJ1cx7kP-hofQ/exec';

  // データを x-www-form-urlencoded 形式にエンコードする
  const formData = new URLSearchParams(data).toString();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  return response.json();
};


function getCurrentShortId() {
  const path = window.location.pathname;
  if (path.startsWith('/share/')) {
    const shortid = path.substring('/share/'.length);
    return shortid;
  }
  return null;
}
// Event listeners...
document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
if (editpageField) editpageField.addEventListener('input', handleEditpageInput);
if (editsideField) editsideField.addEventListener('input', handleEditsideInput);
if (edittitleField) edittitleField.addEventListener('input', handleEdittitleInput);
if (langSelect) langSelect.addEventListener('change', handleLangSelectChange);
if (editsaveButton) editsaveButton.addEventListener('click', handleEditsaveButtonClick);
if (shareButton) shareButton.addEventListener('click', handleShareButtonClick);