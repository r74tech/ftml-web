import '@/../resources/css/main.scss';
import '@wikijump/ftml-components/src/index.ts';

import css from './css/wikidot.css';
import init from './css/init.css';
import collapsible from './css/collapsible.css';

import { TextWikiParseInclude, Wiki } from './script/include';


import {
  handleDOMContentLoaded
} from './script/eventHandlers';


document.querySelector("head > style#innercss")!.innerHTML = css;
document.querySelector("head > style#collapsible")!.innerHTML = collapsible;
document.querySelector("head > style#init")!.innerHTML = init;
// Event listeners...
document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);





const wiki: Wiki = {
  source: '\n[[include self]]\n',
  vars: {}
};

console.log("Source before parsing: \n", wiki.source);  // 'Some text before \n[[include some-page]]\n and some text after.' を出力
const parser = new TextWikiParseInclude(wiki);
parser.parse();
console.log(wiki.source);  // 'Some text before This is some page content. and some text after.' を出力