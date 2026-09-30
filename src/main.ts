import { mount } from 'svelte';

import App from './App.svelte';
import './styles/global.css';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Mount target #app is missing from index.html');
}

// Offline support: production only, so the dev server is never served from a cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}

export default mount(App, { target });
