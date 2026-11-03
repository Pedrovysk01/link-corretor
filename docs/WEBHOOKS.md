# Avisos para outros sistemas (webhooks)

No painel, em **menu do usuário → Integrações**, cada estabelecimento cadastra até 5 endereços. Exemplos de destino:
n8n, Make, Zapier, um CRM ou uma automação de WhatsApp. A cada evento escolhido, o Seu Cliente Fiel manda um **POST
em JSON** para esse endereço.

O aviso sai do próprio banco (Supabase), sem atrasar o carimbo no balcão. Tudo está na migração
`supabase/migrations/20261023000100_webhooks.sql`.

## Eventos

| Evento | Quando |
| --- | --- |
| `customer.created` | Cliente pegou o cartão pela página (ou foi cadastrado no painel) |
| `stamp.added` | Carimbo dado: no painel, no leitor, de boas-vindas ou por comprovante (`data.source` diz qual) |
| `reward.redeemed` | Cartão completo e recompensa resgatada |
| `stamp.undone` | Carimbo desfeito no painel |
| `stamp_request.created` | Pedido de carimbo: boas-vindas ou comprovante enviado pelo WhatsApp |
| `stamp_request.approved` | O dono aprovou o pedido de carimbo |
| `stamp_request.rejected` | O dono recusou o pedido de carimbo |
| `lead.wifi` | Alguém deixou nome e WhatsApp para pegar a senha do Wi-Fi |
| `webhook.test` | O dono tocou em "Testar" |

## Exemplo

```json
{
  "id": "6f1d6a7e-…",
  "event": "stamp.added",
  "created_at": "2026-10-09T15:04:05.123Z",
  "business": { "id": "…", "name": "Café da Praça", "slug": "cafe-da-praca" },
  "data": {
    "customer": { "id": "…", "name": "Ana Clara", "code": "K7P4QX", "phone": "48999990000", "email": null },
    "qty": 1, "source": "panel", "stamps": 3, "total": 3, "redeemed": 0, "full": false,
    "card": { "name": "Café da Praça", "stamps": 8, "reward": "Um café grátis" }
  }
}
```

Cabeçalhos de cada aviso:

- `X-SCF-Event`: o nome do evento (igual a `event`).
- `X-SCF-Delivery`: id único do aviso, igual a `id`. Guarde-o para não processar o mesmo aviso duas vezes, porque
  um reenvio repete o mesmo id.
- `X-SCF-Signature: t=<unix>,v1=<hex>`: assinatura HMAC-SHA256 feita com o **segredo** do webhook sobre
  `t + "." + corpo_bruto`.

## Conferir a assinatura

Use o corpo **bruto**, como chegou, antes de transformar em objeto. Recuse avisos com mais de 5 minutos.

```js
// Node (Express com express.raw({ type: "application/json" }))
const crypto = require("crypto");
const [t, v1] = req.get("X-SCF-Signature").split(",").map((p) => p.split("=")[1]);
const mac = crypto.createHmac("sha256", process.env.SCF_SECRET).update(t + "." + req.body).digest("hex");
const ok = crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(v1)) && Math.abs(Date.now() / 1000 - Number(t)) < 300;
```

```python
# Python
import hmac, hashlib, time
parts = dict(p.split("=", 1) for p in request.headers["X-SCF-Signature"].split(","))
mac = hmac.new(SEGREDO.encode(), (parts["t"] + ".").encode() + request.get_data(), hashlib.sha256).hexdigest()
ok = hmac.compare_digest(mac, parts["v1"]) and abs(time.time() - int(parts["t"])) < 300
```

O segredo aparece no painel, no botão **Segredo** de cada webhook. "Trocar segredo" invalida o anterior na hora.

## Entrega e reenvio

- O destino deve responder **2xx** em até 8 segundos.
- Se não responder, o aviso é reenviado até **5 vezes**: 1, 4, 9 e 16 minutos depois. O reenvio usa o agendador
  `pg_cron` do Supabase, que roda a cada minuto.
- Depois de 50 falhas seguidas, o webhook é **pausado**. O dono religa no painel.
- O painel mostra o último status e as **Entregas** de cada webhook.
- O histórico de entregas fica guardado por 30 dias.

## Segurança

- Só o dono vê e mexe nos próprios webhooks (regras de acesso do Supabase). O segredo nunca é enviado em nenhum aviso.
- O destino precisa ser **https** e ter domínio. Não são aceitos IP, `localhost`, `.local`, `.internal` e
  semelhantes, porque o envio sai da rede do servidor.
- Os avisos levam dados do cliente (nome, telefone, e-mail). Use destinos de confiança e trate esses dados conforme a
  LGPD.

## Testes

O teste `python tests/check-webhooks.py` usa o Supabase local e libera um receptor falso neste computador (tabela
`webhook_dev_hosts`, que fica vazia em produção). Ele confere:

- se os eventos chegam e se a assinatura está correta;
- o filtro por evento;
- o reenvio depois de erro 500;
- as permissões.
