import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/preact';
import { RecipeIngredients } from '../src/products/insights/components/RecipeIngredients.jsx';

describe('Recipe ingredient images', () => {
  it('shows the product image beside its name and quantity', () => {
    render(
      <RecipeIngredients
        ingredients={[{ id: '1', quantity: 2, product: { name: 'Frango', unit: 'pacotes', image_url: 'https://example.com/frango.jpg' } }]}
      />
    );
    expect(screen.getByRole('img', { name: 'Frango' }).getAttribute('src')).toBe('https://example.com/frango.jpg');
    expect(screen.getByText('2 pacotes')).toBeTruthy();
  });
  it('keeps product information when an image fails', () => {
    render(
      <RecipeIngredients
        ingredients={[{ id: '1', quantity: 1, product: { name: 'Batata', unit: 'pacote', image_url: 'https://example.com/batata.jpg' } }]}
      />
    );
    fireEvent.error(screen.getByRole('img', { name: 'Batata' }));
    expect(screen.getByText('Imagem indisponível')).toBeTruthy();
    expect(screen.getByText('Batata')).toBeTruthy();
    expect(screen.getByText('1 pacote')).toBeTruthy();
  });
  it('handles missing products and unsafe image URLs', () => {
    render(
      <RecipeIngredients
        ingredients={[
          { id: '1', quantity: 1, product: null },
          { id: '2', quantity: 3, product: { name: 'Arroz', image_url: 'javascript:alert(1)' } }
        ]}
      />
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('Ingrediente indisponível')).toBeTruthy();
    expect(screen.getByText('Arroz')).toBeTruthy();
  });
});
