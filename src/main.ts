import '@/../resources/css/main.scss';
import '@wikijump/ftml-components/src/index.ts';
import css from './css/wikidot.css';
import init from './css/init.css';
import collapsible from './css/collapsible.css';
import YAML from 'yaml';
import { debounce } from 'ts-debounce';
import shortid from 'shortid';
import ftmlWorker from './ftml.web.worker.js?bundled-worker&dataurl';

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbzj12BQxRif0EWFU3xVZ5j0QPOVkFVxaIHjR-j8--XbTCf-PCvcF9buzhWdiidmgyxHNg/exec"

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
const historyButton = document.getElementById('actionarea-history');
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

const setTextContentForElement = (selector, text) => {
  const element = document.querySelector(selector);
  if (element) {
    element.textContent = text;
  }
};

const getOrCreateShortId = () => {
  const accountKey = 'accountShortId';
  let shortId = localStorage.getItem(accountKey);

  if (!shortId) {
    shortId = generateShortId();
    localStorage.setItem(accountKey, shortId);
  }

  return shortId;
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
    source: `'${editpageField.value}`, // Add a newline at the end of the source
    createdby: getOrCreateShortId(),
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


// 履歴ボタンを押したときの処理
const handleHistoryButtonClick = async () => {
  if (!getCurrentShortId()) return;

  const shortId = getCurrentShortId();
  const historyData = await getHistoryFromGAS(shortId);

  if (historyData.error) {
    console.error(historyData.error);
    return;
  }

  renderHistoryTable(shortId, historyData.data);
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

const displayData = (data: any) => {
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
  const userName = getOrCreateShortId();
  const userInfo = document.querySelector(".wj-user-info.printuser");
  if (userInfo) {
    userInfo.childNodes.forEach(node => {
      if (node.nodeType === 3 && node.nodeValue.trim() === "Default") { // 3 はテキストノードを意味する
        node.nodeValue = userName;
      }
    });
  }
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

  document.body.addEventListener('click', function (e) {
    if (e.target && e.target.className === 'view-link') {
      if (document.getElementById('page-version-info')) {
        const pageVersionInfo = document.getElementById('page-version-info');
        pageVersionInfo.parentNode.removeChild(pageVersionInfo);
      }
      const shortId = e.target.dataset.shortId;
      const revisionId = e.target.dataset.revisionId;
      displayRevisionData(shortId, revisionId);
    }
    if (e.target && e.target.className === 'source-link') {
      const shortId = e.target.dataset.shortId;
      const revisionId = e.target.dataset.revisionId;
      displayRevisionSource(shortId, revisionId);
    }
  });
};


async function fetchDataFromGAS(params) {
  const apiUrl = `${GAS_API_URL}?${new URLSearchParams(params).toString()}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data from GAS. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data from GAS:', error);
    return { error: 'Failed to fetch data from GAS' };
  }
}

// 上記のヘルパーを利用した関数たち
async function getDataFromGAS(shortId) {
  return fetchDataFromGAS({ shortid: shortId });
}

async function getHistoryFromGAS(shortId) {
  return fetchDataFromGAS({ shortid: shortId, history: true });
}

async function getRevisionFromGAS(shortId, revisionId) {
  return fetchDataFromGAS({ shortid: shortId, revisionid: revisionId, revision: true });
}

async function postDataToGAS(data) {
  // データを x-www-form-urlencoded 形式にエンコードする
  const formData = new URLSearchParams(data).toString();

  const response = await fetch(GAS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData
  });

  return response.json();
}


function getCurrentShortId() {
  const path = window.location.pathname;
  if (path.startsWith('/share/')) {
    const shortid = path.substring('/share/'.length);
    return shortid;
  }
  return null;
}

function renderHistoryTable(shortId: string, historyArray: Array<any>) {
  const tableBody = document.querySelector('.page-history tbody');

  // Clear the previous content
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }

  // Header row
  const headerRow = document.createElement('tr');
  const headers = ['rev.', '', 'flags', 'actions', 'by', 'date', 'comments'];
  headers.forEach(header => {
    const td = document.createElement('td');
    td.innerText = header;
    headerRow.appendChild(td);
  });
  tableBody.appendChild(headerRow);

  // Data rows
  historyArray.forEach((item, index) => {
    console.debug(item);

    const row = document.createElement('tr');
    row.id = `revision-row-${item.revisionId}`;

    // Revision TD
    const revTd = document.createElement('td');
    revTd.innerText = index;  // revision index should start from 1
    row.appendChild(revTd);

    // Empty TD for radio buttons
    const emptyTd = document.createElement('td');
    row.appendChild(emptyTd);

    // Flags TD (Placeholder as no specific flag data provided)
    const flagsTd = document.createElement('td');
    flagsTd.innerText = "N/A"; // Replace with actual flag data if available
    row.appendChild(flagsTd);

    // Actions TD (links for view and source)
    const actionsTd = document.createElement('td');
    actionsTd.style.width = "5em";
    actionsTd.className = "optionstd";
    // Vボタンの追加
    const viewLink = document.createElement('a');
    viewLink.innerText = "V";
    viewLink.dataset.shortId = shortId;
    viewLink.dataset.revisionId = item.revisionId.toString();
    viewLink.href = "javascript:void(0)";
    viewLink.className = "view-link";
    actionsTd.appendChild(viewLink);

    // Sボタンの追加
    const sourceLink = document.createElement('a');
    sourceLink.innerText = "S";
    sourceLink.dataset.shortId = shortId;
    sourceLink.dataset.revisionId = item.revisionId.toString();
    sourceLink.href = "javascript:void(0)";
    sourceLink.className = "source-link";
    actionsTd.appendChild(sourceLink);

    row.appendChild(actionsTd);

    // User TD
    const userTd = document.createElement('td');
    userTd.innerText = item.createdBy; // using createdBy from the data for username
    row.appendChild(userTd);

    // Date TD
    const dateTd = document.createElement('td');
    dateTd.innerText = new Date(item.createdAt).toLocaleString();
    row.appendChild(dateTd);

    // Comments TD (Placeholder as no specific comment data provided)
    const commentTd = document.createElement('td');
    commentTd.innerText = "N/A"; // Replace with actual comment data if available
    row.appendChild(commentTd);

    tableBody.appendChild(row);
  });
}

async function displayRevisionData(shortId: string, revisionId: string) {
  const revisionData = await getRevisionFromGAS(shortId, revisionId);

  console.debug(revisionData.data);

  if (revisionData.data.source) {
    ftml.postMessage({ value: revisionData.data.source, type: "page" });
  }
  if (revisionData.data.title) {
    const pageTitle = document.querySelector("#page-title");
    if (pageTitle) pageTitle.innerHTML = revisionData.data.title;
  }
  // リビジョン情報の動的生成
  createPageVersionInfo(revisionData.data);
}

async function displayRevisionSource(shortId: string, revisionId: string) {
  const revisionData = await getRevisionFromGAS(shortId, revisionId);

  if (revisionData && revisionData.data) {
    // ソース情報の表示
    const historyElement = document.getElementById('history-subarea');
    if (historyElement) {
      historyElement.style.display = "block";
    }

    setTextContentForElement('.page-source-title', `Page Source Revision Number: ${revisionData.data.revisionNum}`);
    setTextContentForElement('.page-source', revisionData.data.source || 'No source available');
  }
}

function hideRevisionSource() {
  const sourceElement = document.getElementById('revision-source');
  if (sourceElement) {
    sourceElement.style.display = "none";
  }
}


function createPageVersionInfo(revisionData) {
  const mainContent = document.getElementById('main-content');
  const pageVersionInfo = document.createElement('div');
  pageVersionInfo.id = "page-version-info";
  pageVersionInfo.style.top = "0px";

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  const rowsData = [
    ["Revision no.:", revisionData.revisionNum],
    ["Date created:", revisionData.createdAt ? formatDateForRevisionData(revisionData.createdAt) : 'N/A'],
    ["By:", revisionData.createdBy || 'N/A'],
    ["Page name:", revisionData.title || 'N/A']
  ];

  rowsData.forEach(rowData => {
    const row = document.createElement('tr');
    rowData.forEach(cellData => {
      const cell = document.createElement('td');
      cell.textContent = cellData;
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  pageVersionInfo.appendChild(table);

  const closeButton = document.createElement('a');
  closeButton.href = "javascript:void(0)";
  closeButton.textContent = "Close this box";
  closeButton.addEventListener('click', () => {
    mainContent.removeChild(pageVersionInfo);
  });
  pageVersionInfo.appendChild(closeButton);
  mainContent.appendChild(pageVersionInfo);
}


function formatDateForRevisionData(dateString) {
  return dateString
    ? (new Date(dateString)).toISOString().slice(0, 19).replace('T', ' ').replace(/-/g, '/')
    : 'N/A';
}


// Event listeners...
document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
if (editpageField) editpageField.addEventListener('input', handleEditpageInput);
if (editsideField) editsideField.addEventListener('input', handleEditsideInput);
if (edittitleField) edittitleField.addEventListener('input', handleEdittitleInput);
if (langSelect) langSelect.addEventListener('change', handleLangSelectChange);
if (editsaveButton) editsaveButton.addEventListener('click', handleEditsaveButtonClick);
if (shareButton) shareButton.addEventListener('click', handleShareButtonClick);
if (historyButton) historyButton.addEventListener('click', handleHistoryButtonClick);