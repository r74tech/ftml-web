import React, { useEffect, useRef, useState, useCallback } from 'react';
import { debounce } from 'ts-debounce';
import { Container, Grid, Typography, Divider, TextareaAutosize, Paper } from '@mui/material';
import { Console, Hook, Decode } from 'console-feed'

import ftmlWorker from './ftml.web.worker.js?bundled-worker&dataurl';

function App() {
  const contentsRef = useRef(null);
  const textAreaRef = useRef(null);
  const ftmlRef = useRef(null);
  const shadowRootRef = useRef(null);

  const [logs, setLogs] = useState([])

  const updateStyles = useCallback((styles) => {
    const existingStyles = shadowRootRef.current?.querySelectorAll('[data-dynamic-style]');
    existingStyles.forEach(style => style.remove());

    styles.forEach(styleContent => {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-dynamic-style', 'true');
      styleEl.textContent = styleContent;
      shadowRootRef.current?.appendChild(styleEl);
    });
  }, []);

  const updateContent = useCallback((event) => {
    const { html, styles } = event.data;
    console.debug('event.data:', event.data);
    if (shadowRootRef.current) {
      shadowRootRef.current.innerHTML = html;
    }
    updateStyles(styles);
  }, [updateStyles]);

  const handleTextareaInput = useCallback(debounce((event) => {
    if (event.target instanceof HTMLTextAreaElement && ftmlRef.current) {
      ftmlRef.current.postMessage({ value: event.target.value });
    }
  }, 1000), []);

  useEffect(() => {
    ftmlRef.current = new Worker(ftmlWorker, { type: 'module' });
    ftmlRef.current.onmessage = updateContent;

    textAreaRef.current?.addEventListener('input', handleTextareaInput);

    return () => {
      textAreaRef.current?.removeEventListener('input', handleTextareaInput);
      ftmlRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (contentsRef.current && !contentsRef.current.shadowRoot) {
      shadowRootRef.current = contentsRef.current.attachShadow({ mode: 'open' });
    }
  }, []);

  useEffect(() => {
    Hook(window.console, log => {
      setLogs(prevLogs => [...prevLogs, Decode(log)])
    });
  }, []);

  return (
    <Container maxWidth="lg" style={{ marginTop: '2rem' }}>
      <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h3" component="h1" gutterBottom>
              FTML-WASM Playground
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={3} style={{ padding: '1em 0', height: '100px', overflowY: "scroll" }}>
              <div ref={contentsRef}></div>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <TextareaAutosize
              id="edit-area"
              name="source"
              minRows={20}
              style={{ width: '100%', height: '200px', overflowY: "scroll" }}
              ref={textAreaRef}
            />
          </Grid>
          <Grid item xs={12}>
          <Divider />
            <Typography variant="h6" component="h6">
              logs
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={3} style={{ height: '400px', overflowY: "scroll" }}>
              <Console logs={logs} variant="dark" />
            </Paper>
          </Grid>
        </Grid>
    </Container>

  );
}

export default App;
