import { ftml } from './worker';
import { setTextContentForElement } from './utils';

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyUuBsrBvyy_QdstSaOYK6RuPl3LonBpayL_c-KsnUza5TFG5kuBdQ_J91Y7GBJyNmEMQ/exec"



// ヘルパー関数
export async function fetchDataFromGAS(params: any) {
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
export async function getDataFromGAS(shortId: string) {
    return fetchDataFromGAS({ shortid: shortId });
}

export async function getDataPWFromGAS(shortId: string, password: string) {
    return fetchDataFromGAS({ shortid: shortId, password: password, pw: true });
}

export async function getHistoryFromGAS(shortId: string) {
    return fetchDataFromGAS({ shortid: shortId, history: true });
}

export async function getRevisionFromGAS(shortId: string, revisionId: string) {
    return fetchDataFromGAS({ shortid: shortId, revisionid: revisionId, revision: true });
}

export async function postDataToGAS(data: any) {
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




export function renderHistoryTable(shortId: string, historyArray: Array<any>) {
    const tableBody = document.querySelector('.page-history tbody');

    // Clear the previous content
    while (tableBody?.firstChild) {
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
    tableBody?.appendChild(headerRow);

    // Data rows
    historyArray.forEach((item, index) => {
        console.debug(item);

        const row = document.createElement('tr');
        row.id = `revision-row-${item.revisionId}`;

        // Revision TD
        const revTd = document.createElement('td');
        revTd.innerText = String(index);  // revision index should start from 1
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

        tableBody?.appendChild(row);
    });
}

export async function displayRevisionData(shortId: string, revisionId: string) {
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

export async function displayRevisionSource(shortId: string, revisionId: string) {
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

export function hideRevisionSource() {
    const sourceElement = document.getElementById('revision-source');
    if (sourceElement) {
        sourceElement.style.display = "none";
    }
}





export function createPageVersionInfo(revisionData: any) {
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
        mainContent?.removeChild(pageVersionInfo);
    });
    pageVersionInfo.appendChild(closeButton);
    mainContent?.appendChild(pageVersionInfo);
}


export function formatDateForRevisionData(dateString: string) {
    return dateString
        ? (new Date(dateString)).toISOString().slice(0, 19).replace('T', ' ').replace(/-/g, '/')
        : 'N/A';
}


export function populatePageIndexList() {
    // ページのリストを表示する要素を取得
    const pageIndexList = document.getElementById('page-index-list');

    if (!pageIndexList) {
        console.error('page-index-list element not found.');
        return;
    }

    // ローカルストレージのすべてのキーを走査
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('FtmlStorage[')) {
            // shortId を抽出
            const shortId = key.match(/\[([^\]]+)\]/)[1];

            const data = JSON.parse(localStorage.getItem(key));
            const title = data.title || 'Untitled';  // タイトルがない場合のデフォルト値

            // 新しいリンク要素を作成
            const linkElem = document.createElement('a');
            linkElem.href = `/share/${shortId}`;
            linkElem.textContent = title;
            linkElem.target = "_blank";  // 新しいタブで開く

            // リンク要素をリスト要素に追加
            const listItem = document.createElement('li');
            listItem.appendChild(linkElem);
            pageIndexList.appendChild(listItem);
        }
    }
}
