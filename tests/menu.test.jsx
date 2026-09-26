import { describe,expect,it } from 'vitest';
import { fireEvent,render,screen } from '@testing-library/preact';
import { Menu } from '../src/design-system/components/Menu.jsx';

describe('Menu',()=>{
  it('opens in a portal and focuses its first enabled item',()=>{
    render(<Menu label="Conta" items={[{label:'Perfil',href:'#/insights/perfil'},{label:'Indisponível',disabled:true}]}/>);
    fireEvent.click(screen.getByRole('button',{name:'Conta'}));

    const menu=screen.getByRole('menu');
    const item=screen.getByRole('menuitem',{name:'Perfil'});
    expect(menu.parentElement).toBe(document.body);
    expect(document.activeElement).toBe(item);
  });
});
