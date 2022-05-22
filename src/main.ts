import css from './css/wikidot.css';
// import  MyWorker from "/src/worker?worker";
const ftmlWorker = new Worker("/src/bundle.js");
// import ftmlWorker from '/src/bundle.js?bundled-worker&dataurl';

// const worker = new MyWorker();

// import { setListeners } from "./listeners";

  // Workerスレッドから受信
  ftmlWorker.onmessage = (event: MessageEvent) => {
    console.log(event.data);
    document.querySelector("head > style:nth-child(5)")!.innerHTML=css;
    const { html, styles } = event.data;

    const previewStyles = document.getElementById('preview-styles')!;
    const previewContent = document.getElementById('preview-content')!;
    previewContent.innerHTML = html;
  };

  const textareaField = document.getElementById('page-content')!;

  textareaField.addEventListener('input', (event) => {
    const { target } = event;
  
    // TextArea要素以外の場合は終了
    if (!(target instanceof HTMLTextAreaElement)) {
      return;
    }
  
    const value = target.value; // 👍
    ftmlWorker.postMessage(value);
  });
