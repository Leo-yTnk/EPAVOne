import { render } from 'preact';
import { App } from './app/App.jsx';
import './design-system/styles/index.css';
import './app/styles/shell.css';

render(<App />, document.getElementById('app'));
