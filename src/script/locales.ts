import YAML from 'yaml';

import { ftml } from './worker';
import { setInnerHtml} from './utils';



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



export const loadlocales = async (lang = 'en') => {
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