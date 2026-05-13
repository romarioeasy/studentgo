<?php
/**
 * Panelas Pará - Configuração
 *
 * IMPORTANTE: este arquivo NÃO deve ser exposto publicamente.
 * O .htaccess no diretório impede acesso direto via navegador.
 */

return [

    // Payment: PayPal NCP link (no server-side API needed)
    'paypal_url' => 'https://www.paypal.com/ncp/payment/YF92FZKXUE2J6',

    // Shipping value (USD)
    'shipping_amount'   => 99.00,
    'shipping_original' => 99.00,

    // Origem permitida para CORS (use o seu domínio em produção).
    'allowed_origin' => '*',

    // Modo debug grava log em api/logs/api.log e devolve detalhes do erro.
    // Em produção, ajuste para false.
    'debug' => true,
];
