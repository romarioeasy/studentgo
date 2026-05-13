<?php
/**
 * Panelas Pará - Verificação de status de transação (MisticPay)
 *
 * Documentação oficial: https://docs.misticpay.com
 *
 * - POST https://api.misticpay.com/api/transactions/check
 * - Headers: ci, cs, Content-Type: application/json
 * - Body: { "transactionId": "..." }
 * - Resposta (HTTP 200):
 *     {
 *       "message": "...",
 *       "transaction": {
 *         "transactionId": "...",
 *         "transactionState": "PENDENTE" | "COMPLETO" | "FALHA",
 *         ...
 *       }
 *     }
 */

require __DIR__ . '/helpers.php';
$config = require __DIR__ . '/config.php';

api_setup_cors($config['allowed_origin']);

// Aceita tanto GET quanto POST por compatibilidade com o frontend
$id = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = trim($_GET['id'] ?? '');
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = api_input();
    $id = trim($input['id'] ?? $input['transactionId'] ?? '');
} else {
    api_json(['error' => 'Método não permitido'], 405);
}

if ($id === '' || !preg_match('/^[A-Za-z0-9\-_]{4,}$/', $id)) {
    api_json(['error' => 'ID de transação inválido'], 400);
}

$mp = $config['misticpay'];

$headers = [
    'ci: ' . $mp['client_id'],
    'cs: ' . $mp['client_secret'],
    'Content-Type: application/json',
    'Accept: application/json',
];

$endpoint = rtrim($mp['base_url'], '/') . '/api/transactions/check';

$result = http_request('POST', $endpoint, $headers, ['transactionId' => $id]);

if ($result['error']) {
    api_json([
        'error'  => 'Falha na comunicação com a operadora',
        'detail' => $result['error'],
    ], 502);
}

$decoded = json_decode($result['body'], true);

if ($result['status'] >= 400 || !is_array($decoded)) {
    api_json([
        'error'  => 'Operadora retornou erro',
        'status' => $result['status'],
        'detail' => $decoded ?? $result['body'],
    ], 502);
}

$tx = $decoded['transaction'] ?? [];
$rawStatus = strtoupper((string)($tx['transactionState'] ?? ''));

// Mapeia para o vocabulário interno do frontend.
// MisticPay usa: PENDENTE / COMPLETO / FALHA
$status = 'PENDING';
if ($rawStatus === 'COMPLETO') {
    $status = 'COMPLETED';
} elseif ($rawStatus === 'FALHA') {
    $status = 'FAILED';
}

// ---------- Decide se vai notificar via Pushcut ----------
// Só dispara UMA vez por transação (quando muda para COMPLETED).
$notifyPushcut = false;
if ($status === 'COMPLETED') {
    $lockDir = __DIR__ . '/logs/notified';
    if (!is_dir($lockDir)) @mkdir($lockDir, 0755, true);
    $lockFile = $lockDir . '/' . preg_replace('/[^A-Za-z0-9_\-]/', '', $id) . '.lock';
    if (!file_exists($lockFile)) {
        @file_put_contents($lockFile, date('c'));
        $notifyPushcut = true;
    }
}

// ---------- Resposta imediata para o frontend ----------
$response = [
    'transaction_id' => $id,
    'status'         => $status,
    'raw_status'     => $rawStatus,
];
http_response_code(200);
header('Content-Type: application/json; charset=utf-8');
echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Garante que a resposta sai antes de chamar o Pushcut (não atrasa o site)
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
}

// ---------- Notifica Pushcut em segundo plano ----------
if ($notifyPushcut) {
    $value   = $tx['value'] ?? 0;
    $payerNm = $decoded['metadata']['clientName'] ?? '';
    $payerCpf = $decoded['metadata']['clientDocument'] ?? '';

    $pushcutUrl = 'https://api.pushcut.io/kEZPLvKMdgtMxNA5IfHYB/notifications/MinhaNotifica%C3%A7%C3%A3o1';
    $payload = [
        'title' => 'Nova doação confirmada — Panelas Pará',
        'text'  => 'R$ ' . number_format((float)$value, 2, ',', '.') . ' aprovado'
                 . ($payerNm ? ' · ' . $payerNm : '')
                 . ' · ID ' . $id,
    ];

    @http_request(
        'POST',
        $pushcutUrl,
        ['Content-Type: application/json', 'Accept: application/json'],
        $payload
    );
}
exit;
