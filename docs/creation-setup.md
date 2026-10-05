# Modo de criação do Insights

## Preparação do banco

1. No projeto Supabase do Yourcipe, abra SQL Editor e execute `supabase/diagnostic.sql`.
2. Exporte o resultado completo como CSV para conferir tabelas, políticas, assinaturas e permissões. A consulta lê apenas metadados; não lê senhas, perfis ou o conteúdo do catálogo.
3. Confira o resultado antes de executar `supabase/038_epavone_creation_atomic.sql`. Essa migração acrescenta duas funções de salvamento transacional e não reaplica seeds ou migrações do Yourcipe. Exige as tabelas, RLS e triggers existentes, além de `is_admin` e `save_site_product_atomic`.
4. Aplique a migração uma vez no SQL Editor. Use primeiro um ambiente de testes com o mesmo esquema. Ela permanece compatível com o Yourcipe.
5. Valide no site com duas contas comuns e uma administradora: criar, editar, recarregar, conflito de versão, isolamento, logout e troca de usuário.

As funções executam com as permissões do usuário (`security invoker`). A função de produto público delega ao escritor existente, que exige admin no servidor. O frontend usa somente a chave pública e a sessão Supabase já configuradas. Não é preciso enviar credenciais pessoais, chaves secretas ou senha do banco.

## Entregas e limites de validação

A consulta e as novas funções são testadas em PostgreSQL embarcado (PGlite), com uma fixture de RLS e integridade: rollback após falha, dono autenticado, conflito de versão, bloqueio de outro usuário e de acesso anônimo. Essa fixture não atesta as políticas atualmente instaladas em produção. Nenhum SQL é executado automaticamente pelo build/deploy.

As imagens continuam usando URLs HTTP/HTTPS. Não há bucket ou serviço novo de upload. A estrutura de seções normalizada do catálogo e a estrutura legada da biblioteca pessoal são tratadas separadamente.

Quando uma função está ausente, o editor mostra uma mensagem de configuração e conserva os campos. Não há fallback para salvamento parcial. Ao salvar e retornar à listagem, os registros são consultados novamente.
