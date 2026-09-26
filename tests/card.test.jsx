import { describe,expect,it } from 'vitest';
import { render } from '@testing-library/preact';
import { Card } from '../src/design-system/components/Card.jsx';

describe('Card',()=>{
  it('is stitched by default',()=>{ const {container}=render(<Card>conteúdo</Card>); const card=container.firstElementChild; expect(card.classList.contains('ds-card')).toBe(true); expect(card.classList.contains('ds-stitched-card')).toBe(true); });
  it('supports semantic elements',()=>{ const {container}=render(<Card as="a" href="#/insights">Insights</Card>); expect(container.firstElementChild.tagName).toBe('A'); });
});
