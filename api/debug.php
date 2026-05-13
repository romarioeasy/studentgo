<?php
/**
 * Panelas Pará - Diagnóstico do backend
 *
 * Acesse no navegador: https://seu-dominio.com/api/debug.php
 *
 * Verifica PHP, cURL, conectividade com a MisticPay e faz uma
 * requisição real de teste para confirmar que as credenciais e o
 * formato do payload estão funcionando.
 *
 * IMPORTANTE: este endpoint exibe informações sensíveis. Em produção,
 * troque "debug" para false em config.php (ou apague este arquivo).
 */

require __DIR__ . '/helpers.php';
$config = require __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');

if (empty($config['debug'])) {
    http_response_code(403);
    echo 'Modo debug está desativado em config.php.';
    exit;
}

$mp = $config['misticpay'];
$endpoint = rtrim($mp['base_url'], '/') . '/api/transactions/create';

$checks = [];

// 1. PHP version
$checks[] = [
    'name'   => 'PHP versão',
    'ok'     => version_compare(PHP_VERSION, '7.4.0', '>='),
    'detail' => PHP_VERSION,
];

// 2. cURL disponível
$checks[] = [
    'name'   => 'Extensão cURL',
    'ok'     => function_exists('curl_init'),
    'detail' => function_exists('curl_init') ? 'disponível' : 'NÃO disponível',
];

// 3. JSON disponível
$checks[] = [
    'name'   => 'Extensão JSON',
    'ok'     => function_exists('json_encode'),
    'detail' => function_exists('json_encode') ? 'disponível' : 'NÃO disponível',
];

// 4. Pasta logs gravável
$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);
$checks[] = [
    'name'   => 'Pasta logs gravável',
    'ok'     => is_dir($logDir) && is_writable($logDir),
    'detail' => $logDir,
];

// 5. POST de teste para a MisticPay
$testTxId = 'PP_DEBUG_' . date('YmdHis');
$testPayload = [
    'amount'        => 5.90,
    'payerName'     => 'Teste Diagnostico',
    'payerDocument' => '11144477735',
    'transactionId' => $testTxId,
    'description'   => 'Teste de diagnostico - Panelas Para',
];

$headers = [
    'ci: ' . $mp['client_id'],
    'cs: ' . $mp['client_secret'],
    'Content-Type: application/json',
    'Accept: application/json',
];

$test = http_request('POST', $endpoint, $headers, $testPayload);

$ok = ($test['status'] === 201) && empty($test['error']);
$checks[] = [
    'name'   => 'POST ' . $endpoint,
    'ok'     => $ok,
    'detail' => $test['error']
        ? ('cURL erro: ' . $test['error'])
        : ('HTTP ' . $test['status']),
];

$decoded = json_decode($test['body'], true);

?><!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Diagnóstico — Panelas Pará</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 32px auto; padding: 0 16px; color: #111; }
  h1 { color: #003A8F; font-size: 22px; margin-bottom: 8px; }
  h2 { font-size: 16px; margin-top: 24px; }
  p.lead { color: #666; margin-bottom: 24px; }
  .check { padding: 14px 16px; border: 1px solid #EAEAEA; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
  .check.ok { background: #E8F4EC; border-color: #B8DCC4; }
  .check.fail { background: #FFF1F1; border-color: #FFD4D4; }
  .name { font-weight: 600; }
  .detail { color: #555; font-size: 13px; font-family: 'SFMono-Regular', Consolas, monospace; word-break: break-all; max-width: 60%; text-align: right; }
  pre { background: #F5F5F5; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; }
  .ok-banner { background: #E8F4EC; border: 1px solid #B8DCC4; color: #1F6D3A; padding: 14px 16px; border-radius: 8px; margin-top: 24px; font-weight: 500; }
  .fail-banner { background: #FFF1F1; border: 1px solid #FFD4D4; color: #B00020; padding: 14px 16px; border-radius: 8px; margin-top: 24px; }
</style>
</head><body>

<h1>Diagnóstico do backend</h1>
<p class="lead">Esta página confirma se o servidor consegue gerar PIX via MisticPay.</p>

<?php foreach ($checks as $c): ?>
  <div class="check <?= $c['ok'] ? 'ok' : 'fail' ?>">
    <span class="name"><?= htmlspecialchars($c['name']) ?></span>
    <span class="detail"><?= htmlspecialchars($c['detail']) ?></span>
  </div>
<?php endforeach; ?>

<?php if ($ok && is_array($decoded) && !empty($decoded['data'])): ?>
  <div class="ok-banner">Tudo funcionando. A integração com a MisticPay está OK.</div>
  <h2>Resposta da MisticPay</h2>
  <pre><?= htmlspecialchars(substr(json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 0, 4000)) ?></pre>
<?php elseif (!empty($test['body'])): ?>
  <div class="fail-banner">A MisticPay rejeitou a requisição. Veja a resposta abaixo para identificar o erro.</div>
  <h2>Resposta da MisticPay</h2>
  <pre><?= htmlspecialchars(substr($test['body'], 0, 4000)) ?></pre>
<?php endif; ?>

</body></html>
