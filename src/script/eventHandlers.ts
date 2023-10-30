// eventHandlers.ts
import { debounce } from 'ts-debounce';



import {
    generateShortId, getOrCreateUserShortId, getCurrentPageShortId, encryptSha256, encryptAES
} from './utils';



import {
    getDataFromGAS, getHistoryFromGAS, postDataToGAS, getDataPWFromGAS,
    renderHistoryTable, displayRevisionData, displayRevisionSource, populatePageIndexList
} from './helper';

import {
    editpageField, edittitleField, editsideField, editsaveButton,
    shareButton, historyButton, langSelect
} from './elements';

import { loadlocales } from './locales';
import { displayLocalStorageData, displayData, displayDataPW } from './loader';

import { ftml } from './worker';





export const handleDOMContentLoaded = async () => {
    const WPconfigItem = localStorage.getItem("WPconfig");
    const userName = getOrCreateUserShortId();
    const userInfo = document.querySelector(".wj-user-info.printuser");
    const layoutSupporer = document.querySelector("#search-top-box > div");
    if (userInfo) {
        userInfo.childNodes.forEach(node => {
            if (node.nodeType === 3 && node.nodeValue.trim() === "Default") { // 3 はテキストノードを意味する
                node.nodeValue = userName;
            }
        });
    }
    if (layoutSupporer) {
        const layoutSupporterImg = document.createElement("img");
        layoutSupporterImg.src = `https://scp.ukwhatn.com/assets/image/layoutSupporter.png?site=wdp&name=${userName}&id=0`;
        layoutSupporer.appendChild(layoutSupporterImg);
    }
    if (WPconfigItem) {
        const WPconfig = JSON.parse(WPconfigItem);
        loadlocales(WPconfig.lang);
    } else {
        loadlocales();
    }
    populatePageIndexList();

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
    } else if (pathParts.length === 3 && pathParts[0] === 'share' && pathParts[1] === "pw") {
        const shortid = pathParts[2]; // shortId を取得

        // console.log(shortid);

        document.body.style.display = "none";
        let password, hash;

        password = prompt("パスワードを入力してください");
        document.body.style.display = "";

        hash = encryptSha256(password);

        try {
            const data = await getDataPWFromGAS(shortid, hash); // 適切な関数名に修正
            if (data.error) {
                displayLocalStorageData(`FtmlStorage[${shortid}]`)
            } else {
                displayDataPW(data.data, password);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            displayLocalStorageData(`FtmlStorage[${shortid}]`)
        }


        // }, 0);

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


// Event Handlers
const handleEditpageInput = debounce((event) => {
    const { target } = event;
    if (!(target instanceof HTMLTextAreaElement)) return;

    const value = target.value;
    const type = "page";
    const shortid = getCurrentPageShortId();

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
    const shortid = getCurrentPageShortId();

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
    const shortid = getCurrentPageShortId();

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
    const shortId = getCurrentPageShortId() || generateShortId();
    const dataToSend = {
        shortid: shortId,
        title: edittitleField.value,
        source: `'${editpageField.value}`, // Add a newline at the end of the source
        createdby: getOrCreateUserShortId(),
    };
    let isPassword = false;
    // #password がある場合はパスワードを送信
    const password = document.getElementById("password");
    if (password.value) {
        isPassword = true;
        dataToSend["password"] = encryptSha256(password.value);
        dataToSend["pw"] = "true";
        dataToSend["title"] = encryptAES(dataToSend["title"], password.value);
        dataToSend["source"] = encryptAES(dataToSend["source"], password.value);
    }

    console.debug('Sending data to GAS:', dataToSend);

    try {
        const response = await postDataToGAS(dataToSend);
        if (response.error) {
            console.error('Error sending data to GAS:', response.error);
        }
        else if (isPassword) {
            window.location.href = `/share/pw/${shortId}`;
        }
        else {
            window.location.href = `/share/${shortId}`;
        }
    } catch (error) {
        console.error('Error sending data to GAS:', error);
    }
};


// 履歴ボタンを押したときの処理
const handleHistoryButtonClick = async () => {
    if (!getCurrentPageShortId()) return;

    const shortId = getCurrentPageShortId();
    const historyData = await getHistoryFromGAS(shortId);

    if (historyData.error) {
        console.error(historyData.error);
        return;
    }

    renderHistoryTable(shortId, historyData.data);
};

if (editpageField) editpageField.addEventListener('input', handleEditpageInput);
if (editsideField) editsideField.addEventListener('input', handleEditsideInput);
if (edittitleField) edittitleField.addEventListener('input', handleEdittitleInput);
if (langSelect) langSelect.addEventListener('change', handleLangSelectChange);
if (editsaveButton) editsaveButton.addEventListener('click', handleEditsaveButtonClick);
if (shareButton) shareButton.addEventListener('click', handleShareButtonClick);
if (historyButton) historyButton.addEventListener('click', handleHistoryButtonClick);