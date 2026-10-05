# Modo de criação do Insights

## Preparação do banco

1. No projeto Supabase do Yourcipe, abra SQL Editor e execute `supabase/diagnostic.sql`.
2. Exporte o resultado completo como CSV para conferir tabelas, políticas, assinaturas e permissões. A consulta lê apenas metadados; não lê senhas, perfis ou o conteúdo do catálogo.
3. Confira o resultado antes de executar `supabase/038_epavone_creation_atomic.sql`. Essa migração acrescenta duas funções de salvamento transacional e não reaplica seeds ou migrações do Yourcipe. Exige as tabelas, RLS e triggers existentes, além de `is_admin`, `slugify`, `save_site_product_atomic` e das tabelas de seções normalizadas da migração 031 do Yourcipe.
4. Depois, aplique `supabase/039_epavone_catalog_sections.sql`, que acrescenta os controles administrativos de seções usados pelo editor público. As duas migrações são necessárias antes de ativar o modo de criação. Aplique os arquivos uma vez, na ordem 038 → 039, no SQL Editor. Use primeiro um ambiente de testes com o mesmo esquema. Ela permanece compatível com o Yourcipe.
5. Valide no site com duas contas comuns e uma administradora: criar, editar, recarregar, conflito de versão, isolamento, logout e troca de usuário.

As funções executam com as permissões do usuário (`security invoker`). A função de produto público delega ao escritor existente, que exige admin no servidor. O frontend usa somente a chave pública e a sessão Supabase já configuradas. Não é preciso enviar credenciais pessoais, chaves secretas ou senha do banco.

## Entregas e limites de validação

A consulta e as novas funções são testadas em PostgreSQL embarcado (PGlite), com uma fixture de RLS e integridade: rollback após falha, dono autenticado, conflito de versão, bloqueio de outro usuário e de acesso anônimo. Essa fixture não atesta as políticas atualmente instaladas em produção. Nenhum SQL é executado automaticamente pelo build/deploy.

As imagens continuam usando URLs HTTP/HTTPS. Não há bucket ou serviço novo de upload. A estrutura de seções normalizada do catálogo e a estrutura legada da biblioteca pessoal são tratadas separadamente.

Quando uma função está ausente, o editor mostra uma mensagem de configuração e conserva os campos. Não há fallback para salvamento parcial. Ao salvar e retornar à listagem, os registros são consultados novamente.

## Configuração no GitHub e no Supabase

- O EPAVOne já usa `src/shared/config/supabase.js`. Confira que URL e chave pública apontam para o **mesmo projeto** do Yourcipe. A chave pública pode ficar no frontend; `service_role`, segredo JWT e senha do banco não podem.
- Em Supabase → Authentication → URL Configuration, permita `https://leo-ytnk.github.io/EPAVOne/` como URL de retorno caso vá usar confirmação, recuperação ou login por redirecionamento. O login por email e senha usa a mesma conta existente.
- A função Edge `swift-price-sync` e seus segredos continuam no mesmo projeto. O frontend usa a sessão do administrador. Não crie outra função, cron ou segredo no GitHub para esta migração.
- O papel administrativo vem de `profiles.role`. Não se concede administração por parâmetro de URL ou configuração do navegador.
- Os PRs são encadeados: responsividade → criação pessoal → compartilhamento/solicitações → administração. Integre nessa ordem; retargete o próximo PR para `main` após integrar sua base.

## Cobertura funcional

Criação e edição pessoal de receitas, produtos e categorias; ingredientes e seções pessoais; exclusão com substituição/remoção de referências e confirmação; códigos de compartilhamento, resgate, biblioteca recebida e cópias; envio, acompanhamento, cancelamento e reenvio de solicitações. A cópia duplica as dependências pessoais do autor e reutiliza produtos públicos.

Administradores têm editores públicos, publicação/arquivamento, revisão de solicitações com histórico, organização de páginas/seções, importação Excel nas seis abas originais, sincronização Swift e manutenção com senha e confirmação explícita. Seções podem ser ocultadas; seus vínculos são preservados. A edição de vínculos pelo formulário conserva a posição de itens já associados e acrescenta novos no final.

A importação mantém os modos `add`, `upsert` e `replace_all` e chama a RPC transacional existente uma única vez. O modelo contém URLs e produtos de exemplo: substitua-os antes de importar em produção. Planilhas com fórmulas são rejeitadas para evitar importar valores antigos em cache.

A navegação usa Font Awesome Free, controles de toque e tabs compactas no celular. O módulo de criação é carregado sob demanda. Testes automatizados verificam interações e PostgreSQL; a inspeção visual em um navegador real e a validação do esquema de produção ainda precisam ser feitas antes do deploy.
