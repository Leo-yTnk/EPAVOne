import { fireEvent, render, screen } from '@testing-library/preact';
import { expect, it } from 'vitest';
import { ContentPreview } from '../src/products/insights/creation/components/ContentPreview.jsx';
import { editorValues } from '../src/products/insights/creation/models/editor.js';
it('previews recipe quantities in product units and ordered instructions, with image failure feedback', () => {
  const values = {
    ...editorValues(),
    name: 'Almoço',
    categoryId: 'c',
    imageUrl: 'https://example.com/test.jpg',
    ingredients: [{ productId: 'p', quantity: 2 }],
    instructions: 'Primeiro\nDepois'
  };
  render(
    <ContentPreview
      type="recipes"
      values={values}
      vocabulary={{ categories: [{ id: 'c', name: 'Família' }], products: [{ id: 'p', name: 'Frango', unit: 'pacote' }] }}
    />
  );
  expect(screen.getByText('2 pacote · Frango')).toBeTruthy();
  expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual(['2 pacote · Frango', 'Primeiro', 'Depois']);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByText('Não foi possível carregar a imagem. Confira o endereço.')).toBeTruthy();
});
