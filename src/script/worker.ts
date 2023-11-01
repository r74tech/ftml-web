import ftmlWorker from '../ftml.web.worker.js?bundled-worker&dataurl';
import { setInnerHtml } from './utils';

export const ftml = new Worker(ftmlWorker, {
    type: 'module',
});

const handleMessage = (event) => {
    const { html, styles, type } = event.data;
    const contentMapping = {
        page: 'page-content',
        side: 'side-bar',
        top: 'top-bar',
    };
    const targetContent = document.getElementById(contentMapping[type]) || document.getElementById('page-content');
    const cleanedHtml = html.replace(/<wj-body class="wj-body">/g, '').replace(/<\/wj-body>/g, '');
    const pageStyles = document.getElementById('page-styles');
    if (styles.length > 0 && pageStyles) {
        styles.forEach((style: string) => {
            const styleEl = document.createElement('style');
            styleEl.textContent = style;
            pageStyles.appendChild(styleEl);
        });
    }

    setInnerHtml(targetContent, cleanedHtml);
};

ftml.onmessage = handleMessage;