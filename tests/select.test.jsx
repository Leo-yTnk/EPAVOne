import { describe,expect,it } from 'vitest';
import { fireEvent,render } from '@testing-library/preact';
import { Select } from '../src/design-system/components/Select.jsx';

describe('Select',()=>{
  it('selects an option',()=>{ let value='a'; const {getByRole,rerender}=render(<Select label="Categoria" options={[{value:'a',label:'A'},{value:'b',label:'B'}]} value={value} onChange={next=>{value=next;}}/>); fireEvent.click(getByRole('button',{name:/Categoria A/i})); fireEvent.click(getByRole('option',{name:'B'})); expect(value).toBe('b'); rerender(<Select label="Categoria" options={[{value:'a',label:'A'},{value:'b',label:'B'}]} value={value}/>); expect(getByRole('button',{name:/Categoria B/i})).toBeTruthy(); });
});
