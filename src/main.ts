import '@/../resources/css/main.scss';
import '@wikijump/ftml-components/src/index.ts';

import css from './css/wikidot.css';
import init from './css/init.css';
import collapsible from './css/collapsible.css';


import {
  handleDOMContentLoaded
} from './script/eventHandlers';


document.querySelector("head > style#innercss")!.innerHTML = css;
document.querySelector("head > style#collapsible")!.innerHTML = collapsible;
document.querySelector("head > style#init")!.innerHTML = init;
// Event listeners...
document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);