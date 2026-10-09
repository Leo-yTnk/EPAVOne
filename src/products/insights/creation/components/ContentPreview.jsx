import { useState } from 'preact/hooks';
import { Alert, Card } from '../../../../design-system/components/index.js';
import { lines } from '../models/editor.js';
export function ContentPreview({ type, values, vocabulary }) {
  const [failedImage, setFailedImage] = useState('');
  const validImage = /^https?:\/\/[^\s]+$/i.test(values.imageUrl);
  return (
    <Card as="section" className="creation-fields creation-content-preview" aria-label="Prévia do conteúdo">
      <div className="creation-section-heading">
        <h3 className="creation-section-title">Prévia do conteúdo</h3>
        <p>Confira como os dados se apresentam antes de salvar.</p>
      </div>
      <div className="creation-preview-layout">
        {validImage && failedImage !== values.imageUrl ? (
          <img
            src={values.imageUrl}
            alt={values.name || 'Imagem do conteúdo'}
            referrerPolicy="no-referrer"
            onError={() => setFailedImage(values.imageUrl)}
          />
        ) : (
          <Alert title="Imagem pendente">
            {failedImage === values.imageUrl && values.imageUrl
              ? 'Não foi possível carregar a imagem. Confira o endereço.'
              : 'Informe uma URL para conferir a imagem.'}
          </Alert>
        )}
        <div className="creation-fields">
          <h4>{values.name || 'Nome do conteúdo'}</h4>
          <p>{vocabulary.categories.find((item) => item.id === values.categoryId)?.name || 'Categoria a definir'}</p>
          {type === 'products' ? (
            <p>Unidade: {values.unit}</p>
          ) : (
            <>
              <p>
                {values.prepTime} minutos · {values.servings} porções · {values.difficulty}
              </p>
              <ul>
                {values.ingredients.map((item, index) => {
                  const product = vocabulary.products.find((product) => product.id === item.productId);
                  return (
                    <li key={index}>
                      {item.quantity} {product?.unit} · {product?.name || 'Escolha o produto'}
                    </li>
                  );
                })}
              </ul>
              <ol>
                {lines(values.instructions).map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
