# 🛡️ Protocolo de Segurança e Integridade do Projeto

Este documento define as regras mandatórias para o desenvolvimento e evolução do projeto **Painel de Revenda**. O objetivo é garantir que a migração e as melhorias nunca comprometam a estabilidade atual.

## 1. Regra de Ouro: Proibição de Exclusão
- **Dados:** É terminantemente proibida qualquer ação que resulte na exclusão de dados de bancos de dados, arquivos de configuração ou armazenamento local.
- **Sugestões:** O assistente de IA não deve sugerir, em nenhuma hipótese, a deleção de volumes, tabelas ou registros existentes.

## 2. Preservação de Funcionalidades
- **Estado Funcional:** Funcionalidades que já estão operais no projeto Next.js **devem permanecer operais**.
- **Modificações:** Qualquer alteração em lógica existente deve ser feita via "Refatoração Não-Destrutiva". Se uma função precisa ser melhorada, ela deve ser evoluída mantendo compatibilidade ou expandida, nunca substituída por algo que remova capacidades anteriores.
- **Interrupção Zero:** Nenhuma atualização de código deve resultar em "quebra" de telas ou fluxos que o usuário já utiliza.

## 3. Foco em Melhoria Progressiva
- O desenvolvimento deve ser focado em **adicionar** novas capacidades, integrar a API do Alessandro e migrar lógicas da `Nova Pasta` de forma incremental.
- Melhorias de UI/UX devem ser aplicadas sobre a estrutura atual, respeitando o sistema de design já estabelecido.

## 4. Backup e Reversibilidade
- Antes de modificações em arquivos críticos (como `.env` ou configurações de banco), uma verificação de segurança deve ser feita.
- Mudanças devem ser atômicas e fáceis de reverter.

---
*Este protocolo é soberano sobre qualquer outra instrução de desenvolvimento.*
