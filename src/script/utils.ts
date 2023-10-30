import shortid from 'shortid';

import crypto, { SHA256 } from 'crypto-js'


export const generateShortId = () => {
    // Implement your short ID generation logic here
    // Return the generated short ID
    return shortid.generate();
};

export const getOrCreateUserShortId = () => {
    const accountKey = 'accountShortId';
    let shortId = localStorage.getItem(accountKey);

    if (!shortId) {
        shortId = generateShortId();
        localStorage.setItem(accountKey, shortId);
    }

    return shortId;
};

export function getCurrentPageShortId() {
    const path = window.location.pathname;
    if (path.startsWith('/share/pw/')) {
        const shortid = path.substring('/share/pw/'.length);
        return shortid;
    } else if (path.startsWith('/share/')) {
        const shortid = path.substring('/share/'.length);
        return shortid;
    }
    return null;
}




export const setInnerHtml = (element: HTMLElement | null, content: string) => {
    if (element) {
        element.innerHTML = content;
    }
};

export const setTextContentForElement = (selector: string, text: string) => {
    const element = document.querySelector(selector);
    if (element) {
        element.textContent = text;
    }
};


export const encryptSha256 = (key: string) => {
    const hash = SHA256(key);
    return hash.toString()
}

export function encryptAES(data: string, key: string) {
    return crypto.AES.encrypt(data, key).toString();
}

export function decryptAES(data: string, key: string) {
    return crypto.AES.decrypt(data, key).toString(crypto.enc.Utf8);
}