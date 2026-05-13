PANELAS PARÁ — SITE DA CAMPANHA DIA DAS MÃES
=============================================

Site estático (HTML, CSS, JavaScript) com backend leve em PHP
para intermediar as chamadas à operadora de pagamento.


REQUISITOS DO SERVIDOR
----------------------

- PHP 7.4 ou superior (Hostinger já oferece por padrão).
- Extensão cURL habilitada (padrão em qualquer hospedagem).
- Servidor com suporte a .htaccess (Apache - padrão Hostinger).


ESTRUTURA DOS ARQUIVOS
----------------------

panelas-para/
  index.html
  README.txt
  css/
    style.css
  js/
    products.js
    validators.js
    cart.js
    ui.js
    checkout.js
    main.js
  api/
    config.php             -> Credenciais MisticPay (NÃO publicar)
    helpers.php            -> Funções utilitárias do backend
    create-transaction.php -> Cria a cobrança PIX
    check-transaction.php  -> Polling de status do pagamento
    debug.php              -> Diagnóstico de conectividade (dev)
    .htaccess              -> Bloqueia acesso direto a config.php
  assets/


COMO HOSPEDAR NA HOSTINGER
--------------------------

1. Acesse o "Gerenciador de Arquivos" da Hostinger.
2. Entre em "public_html".
3. Apague o index.html que vem por padrão.
4. Selecione o conteúdo da pasta panelas-para
   (index.html, README.txt, css/, js/, api/, assets/) e
   arraste para "public_html".
5. Pronto. Acesse o seu domínio.


O PIX NÃO ESTÁ FUNCIONANDO? FAÇA ISTO:
--------------------------------------

ATENÇÃO: o pagamento NUNCA funciona se você abrir index.html
direto pelo Explorador de Arquivos (file://...). É preciso um
servidor com PHP rodando — Hostinger ou "php -S 127.0.0.1:8000"
local.

Passo a passo de diagnóstico:

1) Abra no navegador:  https://seu-dominio.com/api/debug.php
   Essa página mostra:
     - Se PHP, cURL e JSON estão disponíveis
     - Se a pasta logs/ é gravável
     - Se o servidor consegue alcançar a MisticPay
     - O que a MisticPay retorna em um POST de teste

2) Se aparecer "HTTP 401" no POST de teste:
   - Abra api/config.php
   - Troque "auth_mode" de 'basic' para 'bearer'
   - Recarregue a página de debug
   - Se ainda 401, troque para 'header'

3) Se aparecer "HTTP 422" ou similar:
   - A MisticPay está rejeitando o formato dos campos
   - Veja a "Resposta da MisticPay" no debug.php para identificar
     qual campo precisa ser ajustado em create-transaction.php

4) Veja também o log detalhado em api/logs/api.log
   (esse arquivo é criado automaticamente quando "debug" está ativo).


CONFIGURAÇÃO DO PIX
-------------------

- Credenciais: api/config.php
- Endpoint create-transaction.php envia o pagamento e
  retorna QR Code (base64) + código copia-e-cola.
- Endpoint check-transaction.php é usado em polling pelo
  frontend (a cada 3s) até o status virar COMPLETED.
- Status reconhecidos como sucesso: COMPLETO, COMPLETED,
  PAID, APPROVED, SUCCESS.
- Os fallbacks dos campos da resposta cobrem os formatos mais
  comuns (qr_code_base64, qrcode, pix.qr_code_base64, etc).
  Se a MisticPay usar outro nome, ajuste em create-transaction.php.


FRETE
-----

Valor cobrado: R$ 5,90 (com R$ 27,90 riscado para evidenciar
desconto). Para alterar, edite "shipping_amount" e
"shipping_original" em api/config.php e os textos em
index.html (busque por "5,90" e "27,90").


COMO EDITAR
-----------

- Trocar panelas: js/products.js
- Trocar cores: variáveis no topo de css/style.css (:root)
- Mudar limite de itens: CART_LIMIT em js/cart.js
- Mudar mensagens de toast: js/main.js e js/checkout.js


SEGURANÇA
---------

- Credenciais MisticPay ficam APENAS no backend PHP.
- O frontend nunca recebe client_id nem client_secret.
- Não publique config.php em repositórios públicos.
- O .htaccess bloqueia acesso direto a config.php e helpers.php.
- Em produção, troque "debug" para false em config.php e
  considere apagar api/debug.php para não expor diagnóstico.


CAMPANHA
--------

Panelas Pará — Belém do Pará
Campanha Dia das Mães 2026
