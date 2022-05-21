import { genTitle } from "./main";


/**
 * Sets all the source change listeners for a preview panel.
 * @param panel The preview panel.
 * @param panelId The preview panel id. This is an id we assign.
 */
function setListeners(panel: vscode.WebviewPanel, panelId: string) {
  let viewChangeDisposable = panel.onDidChangeViewState(_=>{
    vscode.commands.executeCommand('setContext', 'ftmlPreviewFocus', panel.active);
    if (panel.active) setActivePreview(panelId);
    let panelInfo = idToInfo.get(panelId)!;
    panelInfo.viewColumn = panel.viewColumn ?? panelInfo.viewColumn;
    idToInfo.set(panelId, panelInfo);
    vscode.commands.executeCommand('setContext', 'ftmlPreviewBackend', panelInfo.backend);
  })
  let docChangeDisposable = vscode.workspace.onDidChangeTextDocument(e=>{
    let panelInfo = idToInfo.get(panelId)!;
    if (lockedPreviews.has(panelId) && panelInfo.fileName!=e.document.fileName) return;
    if (e.document.languageId == 'ftml') {
      if (panelInfo.backend=='ftml' && panelInfo.live) {
        serveBackendDebounced(panel,
          e.document.fileName,
          e.document.getText(),
          panelInfo.backend);
      }
    }
  });
  if (!lockedPreviews.has(panelId)) {
    setTabChangeListener(panel, panelId);
  }

  panel.onDidDispose(()=>{
    openPreviews.delete(panelId);
    
    if (lockedPreviews.has(panelId)) {
      lockedPreviews.delete(panelId);
      ctx.workspaceState.update('ftml.lockedPreviews', [...lockedPreviews]);
    }
    ctx.workspaceState.update(`ftml.previews.${panelId}`, undefined);
    viewChangeDisposable.dispose();
    docChangeDisposable.dispose();
    if (idToTabChangeListener.has(panelId)) {
      idToTabChangeListener.get(panelId)?.dispose();
      idToTabChangeListener.delete(panelId);
    }
  })
}


export {
  setListeners,
};