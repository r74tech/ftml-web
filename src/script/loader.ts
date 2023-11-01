import { editpageField, edittitleField, editsideField} from './elements';

import { ftml } from './worker';
import { decryptAES} from './utils';
import { TextWikiParseInclude } from "./include";

// ローカルストレージからデータを読み込んで表示する関数
export const displayLocalStorageData = (itemName = "FtmlStorage") => {
    const FtmlStorageItem = localStorage.getItem(itemName);
    if (FtmlStorageItem) {
        const FtmlStorage = JSON.parse(FtmlStorageItem);
        edittitleField.value = FtmlStorage.title;
        editpageField.value = FtmlStorage.page;
        editsideField.value = FtmlStorage.side;

        if (FtmlStorage.page) {
            // ftml.postMessage({ value: FtmlStorage.page, type: "page" });
            const wiki = {
                source: FtmlStorage.page,
                vars: {}
            };

            // console.log("Source before parsing: \n", wiki.source);
            const parser = new TextWikiParseInclude(wiki);

            // onEditでthis.wiki.sourceを更新する。editpageFieldが更新されたらonEditにeventを渡す。
            // editpageField.addEventListener('input', parser.onEdit.bind(parser));
            parser.parse().then(() => {
                // console.log("Source after parsing: \n", wiki.source);
                ftml.postMessage({ value: wiki.source, type: "page" });
            }
            ).catch(error => {
                console.error("Parsing failed with error: ", error);
            });
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

export const displayData = (data: any) => {
    edittitleField.value = data.title;
    editpageField.value = data.source;
    editsideField.value = ''; // Assuming there's no side in this data structure.

    if (data.source) {
        // ftml.postMessage({ value: data.source, type: "page" });
        const wiki = {
            source: data.source,
            vars: {}
        };

        // console.log("Source before parsing: \n", wiki.source);
        const parser = new TextWikiParseInclude(wiki);

        // onEditでthis.wiki.sourceを更新する。editpageFieldが更新されたらonEditにeventを渡す。
        // editpageField.addEventListener('input', parser.onEdit.bind(parser));
        parser.parse().then(() => {
            // console.log("Source after parsing: \n", wiki.source);
            ftml.postMessage({ value: wiki.source, type: "page" });
        }
        ).catch(error => {
            console.error("Parsing failed with error: ", error);
        });
    }

    if (data.title) {
        const pageTitle = document.querySelector("#page-title");
        if (pageTitle) pageTitle.innerHTML = data.title;
    }
};




// ローカルストレージからデータを読み込んで表示する関数
export const displayLocalStorageDataPW = (itemName = "FtmlStorage", password) => {
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

export const displayDataPW = (data: any, password: string) => {

    // decryptAESで復号化
    let decryptedtitle = decryptAES(data.title, password);
    let decryptedsource = decryptAES(data.source, password);

    console.log(decryptedtitle, decryptedsource);

    // もしdecryptedsourceが、'から始まるなら、'を削除する
    if (decryptedsource.startsWith("'")) {
        decryptedsource = decryptedsource.slice(1);
    }

    edittitleField.value = decryptedtitle;
    editpageField.value = decryptedsource;
    
    editsideField.value = ''; // Assuming there's no side in this data structure.

    if (decryptedsource) {
        ftml.postMessage({ value: decryptedsource, type: "page" });
    }

    if (decryptedtitle) {
        const pageTitle = document.querySelector("#page-title");
        if (pageTitle) pageTitle.innerHTML = decryptedtitle;
    }
};