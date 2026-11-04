# Painel local — Link Corretor

## Rodar

Duplo clique em `Iniciar painel.bat` (ou `python tools/link-server.py`) e abra http://localhost:8090/painel/.
Só precisa de Python 3.11+ (biblioteca padrão). Escuta apenas em `127.0.0.1`. A porta 8080 fica com o Docker.

Primeiro acesso: o painel pede o nome da empresa e cria a conta do dono. A caixa "dados de exemplo" já vem marcada
(3 corretores fictícios com senha `corretor123`, clientes, aberturas e perguntas); apague em Configurações quando quiser.

## O modelo (o que sustenta a comissão)

1. O corretor gera um link por empreendimento e canal (`/r/<código>`).
2. O cliente abre e **vê a apresentação na hora**. Uma faixa fixa no topo diz "Atendimento por <corretor>".
3. Na **terceira interação** (toque, clique ou tecla na apresentação), um popup pede nome + WhatsApp ou e-mail, com aceite.
   A IA e o recado também pedem o cadastro. Depois disso, no mesmo aparelho, abre direto por um ano.
4. Cada abertura fica **no nome do cliente**: quando, por qual link, de que aparelho e por quanto tempo (heartbeat a cada 30 s).
   Recarregar a página dentro de 20 min não conta de novo; abrir por outro link conta.
5. **O cliente pertence ao primeiro corretor** por quem se identificou (chave: WhatsApp, senão e-mail). Se abrir o link de
   outro corretor, a abertura é registrada e marcada "outro link", a faixa continua mostrando o corretor original e o
   cliente avisa que já é atendido. Só o dono transfere, na página do cliente; a transferência fica nas anotações.

## O que existe

| Quem | Faz |
|---|---|
| Dono | Resumo (clientes novos, aberturas, retornos, ranking); **Clientes** (todos, com corretor de origem, filtros, busca, CSV); **Corretores** → página do corretor com os clientes dele; página do **cliente** (histórico de aberturas, perguntas à IA, recado, anotações, situação, transferir); Empreendimentos; Links; Perguntas à IA; Configurações |
| Corretor (celular) | Resumo, Clientes (só os dele), Meus links (copiar, QR, WhatsApp), Perguntas |
| Cliente final | Apresentação com faixa do corretor; popup de cadastro na 3ª interação; IA; recado; WhatsApp do corretor |

## Tela de perfis e aviso de cliente novo

**Tela inicial da apresentação** (`/r/<código>` → `/p/<código>/`): antes de qualquer coisa aparecem três botões.

| Botão | O que acontece |
|---|---|
| **Construtora** | Abre o painel (`/painel/`). |
| **Corretor** | Apresentação normal: **sem coleta de dados** (sem faixa, sem IA, sem cadastro, sem batimento). Um selo "Modo corretor" permite trocar o perfil. |
| **Cliente** | Apresentação com o corretor do link; na **3ª interação** (toque, clique ou tecla) abre o popup de cadastro (nome + WhatsApp ou e-mail + aceite). |

A escolha vale até fechar a aba. Quem já se cadastrou neste aparelho abre direto como cliente (não vê a tela de perfis).

**Aviso lateral no painel:** **5 minutos** depois que o cliente abriu e se cadastrou, aparece um cartão à direita: *"Cliente abriu e se cadastrou · há 5 min — <nome> · <empreendimento> · Veio do corretor <X> · <canal>"*, com o botão "Ver cliente". O dono vê o corretor de origem; cada corretor vê só os seus (*"Veio do seu link"*). O atraso muda em **Configurações → Aviso de cliente novo** (0 a 120 min). Clientes que voltam a abrir avisam na hora.

## IA

`claude -p` do Claude Code instalado (assinatura, sem chave de API), modelo `haiku` (`LC_AI_MODEL` troca). Responde só com o
texto "O que a IA sabe" do empreendimento e cita o corretor quando não souber. Teto mensal em Configurações.

## Empreendimentos cadastrados

Bossa (`Planta-Interativa/Planta Interativa/app`) e Felicità 402 (`.../apresentacao`). Textos da IA em `tools/seed/*.txt`,
gerados dos dados reais das apresentações. **Revise preços e disponibilidade.** O dono vê a apresentação sem rastreio em `/pre/<id>/`.

## Dados, segurança e testes

Banco SQLite em `dados/link-corretor.db` (fora do git; `LC_DB=<caminho>` usa outro). Bancos da versão anterior migram sozinhos
(leads viram clientes). Segurança: senha PBKDF2, cookies HttpOnly/SameSite, JSON + mesma origem nas escritas, limite por
endereço, bloqueio de `..`, ocultos, `tests/` e `.md` nas apresentações; corretor só enxerga os próprios clientes.

Visual: identidade herdada da apresentação do Bossa (tinta #16302e, papel #f3efe6, latão #c9944a; Instrument Serif + Figtree).
Catálogo de movimento e auditoria em `.ds-audit/` (fora do git).

## Ainda não é produção

HTTPS, IA por API, domínio dos links, e-mail de convite em vez de senha na tela, backup do banco. A pasta `app/` e `supabase/`
(cópia do projeto anterior) **não** são o painel atual.
