import '@/../resources/css/main.scss';
import '@wikijump/ftml-components/src/index.ts';

import css from './css/wikidot.css';
import init from './css/init.css';
import collapsible from './css/collapsible.css';

import { TextWikiParseInclude } from './script/include';


import {
  handleDOMContentLoaded
} from './script/eventHandlers';


document.querySelector("head > style#innercss")!.innerHTML = css;
document.querySelector("head > style#collapsible")!.innerHTML = collapsible;
document.querySelector("head > style#init")!.innerHTML = init;
// Event listeners...
document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);




// const wiki: Wiki = {
//   source: '[[include component:topsubtitle |TITLE=test]]',
//   vars: {}
// };

// console.log("Source before parsing: \n", wiki.source);
// const parser = new TextWikiParseInclude(wiki);
// parser.parse().then(() => {
//   console.log("Source after parsing: \n", wiki.source);
// }).catch(error => {
//   console.error("Parsing failed with error: ", error);
// });
