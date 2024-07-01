import { init, renderHTML, ready, loading, makeInfo } from './lib/ftml-wasm/esm/wj-ftml-wasm.esm.js';

init();

onmessage = async (e) => {
  if (!ready) await loading;
  const ftmlSource = e.data.value;

  const info = makeInfo({ score: 0 });
  const { html, html_meta, backlinks } = renderHTML(ftmlSource, info);
  const { styles, cleanedHtml } = extractStylesAndCleanHtml(html); // HTMLからスタイルを抽出し、クリーンなHTMLを取得
  const type = e.data.type;

  postMessage({ html: cleanedHtml, styles, type });
};

// HTMLからスタイルを抽出し、クリーンなHTMLを取得する関数
function extractStylesAndCleanHtml(html) {
  const styleMatches = html.match(/<style[^>]*>([^<]*)<\/style>/g);
  const styles = styleMatches ? styleMatches.map(style => style.replace(/<\/?style[^>]*>/g, '')) : [];
  const cleanedHtml = html.replace(/<style[^>]*>[^<]*<\/style>/g, '');
  return { styles, cleanedHtml };
}