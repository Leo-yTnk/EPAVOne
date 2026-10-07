import { migrateLegacyStorage } from './shared/services/legacyStorage.js';
import { render } from 'preact';
import { App } from './app/App.jsx';
import './design-system/styles/index.css';
import './app/styles/shell.css';

migrateLegacyStorage();
render(<App />, document.getElementById('app'));
