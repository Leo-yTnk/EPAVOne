import { Button, Icon } from './ui';

export function Header({ dark, onTheme }) {
  return <header className="header glass">
    <a className="brand" href="#top" aria-label="EPAVOne — início"><span className="brand-mark">e.</span><span>EPAV<b>One</b></span></a>
    <nav aria-label="Navegação principal"><a className="active" href="#top">Visão geral</a><a href="#ferramentas">Ferramentas</a><a href="#fluxo">Como funciona</a></nav>
    <Button variant="icon" onClick={onTheme} aria-label={dark ? 'Ativar tema claro' : 'Ativar tema escuro'} aria-pressed={dark}><Icon name={dark ? 'sun' : 'moon'} /></Button>
  </header>;
}
