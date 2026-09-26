# EPAVOne

Workspace React que conecta **EPAVInsights**, **EPAVPlanner** e **EPAVWriter** em uma experiência única, modular e pronta para crescer.

## Começando

```bash
npm install
npm run dev
```

Para validar a versão de produção, use `npm run build` e `npm run preview`.

## Estrutura

```text
src/
├── components/       # Componentes compartilhados e primitivos de interface
├── data/             # Conteúdo e configurações desacoplados da apresentação
├── App.jsx           # Composição da experiência
├── main.jsx          # Ponto de entrada React
└── styles.css        # Design system completo e estilos da aplicação
```

Os componentes de `ui.jsx` — `Button`, `Card`, `Badge`, `Select`, `Slider`, `Progress` e `Icon` — são a base para novas interfaces. Evite recriar controles localmente: amplie suas variantes mantendo API, acessibilidade e estados consistentes.

## Princípio de produto

> **“Design is not just what it looks like and feels like. Design is how it works.”**

O princípio é um critério de aceite, não decoração. Toda entrega deve oferecer feedback claro, entendível, constante e completo; animações intencionais que expliquem mudanças; e responsividade impecável, do menor viewport ao desktop. Leia as regras completas em [`CONTRIBUTING.md`](./CONTRIBUTING.md).
