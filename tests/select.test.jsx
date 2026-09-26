import { describe,expect,it } from 'vitest';
import { fireEvent,render,screen } from '@testing-library/preact';
import { Select } from '../src/design-system/components/Select.jsx';

describe('Select',()=>{
  it('renders its listbox in a portal and selects with keyboard',()=>{
    let value='a';
    const {rerender}=render(<Select label="Categoria" options={[{value:'a',label:'A'},{value:'b',label:'B'}]} value={value} onChange={next=>{value=next;}}/>);
    const trigger=screen.getByRole('button',{name:/Categoria A/i});

    fireEvent.click(trigger);
    const listbox=screen.getByRole('listbox');
    expect(listbox.parentElement).toBe(document.body);

    fireEvent.keyDown(trigger,{key:'ArrowDown'});
    fireEvent.keyDown(trigger,{key:'Enter'});
    expect(value).toBe('b');

    rerender(<Select label="Categoria" options={[{value:'a',label:'A'},{value:'b',label:'B'}]} value={value}/>);
    expect(screen.getByRole('button',{name:/Categoria B/i})).toBeTruthy();
  });
});
