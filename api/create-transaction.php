<?php
/**
 * Panelas Pará - Criação de transação PIX (MisticPay)
 *
 * Documentação oficial: https://docs.misticpay.com
 *
 * - POST https://api.misticpay.com/api/transactions/create
 * - Headers: ci, cs, Content-Type: application/json
 * - Body: { amount, payerName, payerDocument, transactionId, description }
 * - Resposta (HTTP 201):
 *     {
 *       "message": "Transação criada com sucesso",
 *       "data": {
 *         "transactionId": "...",
 *         "qrCodeBase64": "data:image/png;base64,...",
 *         "qrcodeUrl": "https://api.qrserver.com/...",
 *         "copyPaste": "00020126..."
 *       }
 *     }
 */

require __DIR__ . '/helpers.php';
$config = require __DIR__ . '/config.php';

api_setup_cors($config['allowed_origin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_json(['error' => 'Método não permitido'], 405);
}

$debug = !empty($config['debug']);
$input = api_input();

if ($debug) api_log('IN', $input);

// ---------- Sanitiza entrada ----------
$customer = [
    'name'       => clean_str($input['name'] ?? '', 120),
    'email'      => clean_str($input['email'] ?? '', 120),
    'phone'      => only_digits($input['phone'] ?? ''),
    'cpf'        => only_digits($input['cpf'] ?? ''),
    'cep'        => only_digits($input['cep'] ?? ''),
    'street'     => clean_str($input['street'] ?? '', 160),
    'number'     => clean_str($input['number'] ?? '', 20),
    'complement' => clean_str($input['complement'] ?? '', 80),
    'district'   => clean_str($input['district'] ?? '', 120),
    'city'       => clean_str($input['city'] ?? '', 120),
    'state'      => clean_str($input['state'] ?? '', 2),
];

$items = isset($input['items']) && is_array($input['items']) ? $input['items'] : [];

// ---------- Validações ----------
$errors = [];
if (mb_strlen($customer['name']) < 3)               $errors['name']     = 'Nome inválido';
if (!filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'E-mail inválido';
if (strlen($customer['phone']) < 10)                $errors['phone']    = 'Telefone inválido';
if (!valid_cpf($customer['cpf']))                   $errors['cpf']      = 'CPF inválido';
if (strlen($customer['cep']) !== 8)                 $errors['cep']      = 'CEP inválido';
if (!$customer['street'])                           $errors['street']   = 'Logradouro obrigatório';
if (!$customer['number'])                           $errors['number']   = 'Número obrigatório';
if (!$customer['district'])                         $errors['district'] = 'Bairro obrigatório';
if (!$customer['city'])                             $errors['city']     = 'Cidade obrigatória';
if (!preg_match('/^[A-Z]{2}$/', strtoupper($customer['state']))) $errors['state'] = 'Estado inválido';
if (count($items) === 0 || count($items) > 5)      $errors['items']    = 'Selecione de 1 a 5 panelas';

if ($errors) {
    if ($debug) api_log('VALIDATION', $errors);
    api_json(['error' => 'Dados inválidos', 'fields' => $errors], 422);
}

// Valor padrão = site principal. Se a requisição vier da página /frete.html
// (campo source = "frete_page"), usa o valor configurado em shipping_amount_frete.
$amount = (float) $config['shipping_amount'];
$source = isset($input['source']) ? (string) $input['source'] : '';
if ($source === 'frete_page' && isset($config['shipping_amount_frete'])) {
    $amount = (float) $config['shipping_amount_frete'];
}

// ---------- Chama MisticPay ----------
$mp = $config['misticpay'];

// Gera um identificador único da transação no nosso lado
$transactionId = 'PP_' . date('Ymd_His') . '_' . substr(strtoupper(bin2hex(random_bytes(4))), 0, 8);

$payload = [
    'amount'        => $amount, // em reais com decimais (ex: 5.90)
    'payerName'     => $customer['name'],
    'payerDocument' => $customer['cpf'],
    'transactionId' => $transactionId,
    'description'   => 'Frete - Campanha Panelas Para',
];

$headers = [
    'ci: ' . $mp['client_id'],
    'cs: ' . $mp['client_secret'],
    'Content-Type: application/json',
    'Accept: application/json',
];

$endpoint = rtrim($mp['base_url'], '/') . '/api/transactions/create';

if ($debug) api_log('OUT', ['endpoint' => $endpoint, 'payload' => $payload]);

$result = http_request('POST', $endpoint, $headers, $payload);

if ($debug) api_log('RESP', [
    'status' => $result['status'],
    'error'  => $result['error'],
    'body'   => substr((string)$result['body'], 0, 1500),
]);

if ($result['error']) {
    $resp = ['error' => 'Falha na comunicação com a operadora de pagamento.'];
    if ($debug) $resp['detail'] = $result['error'];
    api_json($resp, 502);
}

$decoded = json_decode($result['body'], true);

// MisticPay retorna 201 em sucesso
if ($result['status'] !== 201 || !is_array($decoded) || !isset($decoded['data'])) {
    $resp = ['error' => 'A operadora retornou um erro ao gerar o PIX.'];
    if ($debug) {
        $resp['detail'] = [
            'http_status' => $result['status'],
            'body'        => $decoded ?? $result['body'],
        ];
    }
    api_json($resp, 502);
}

$data = $decoded['data'];

$qrBase64    = $data['qrCodeBase64'] ?? '';
$qrCopyPaste = $data['copyPaste']    ?? '';
$qrUrl       = $data['qrcodeUrl']    ?? '';
$txId        = $data['transactionId'] ?? $transactionId;

if (!$qrCopyPaste) {
    $resp = ['error' => 'A operadora não retornou o código PIX.'];
    if ($debug) $resp['detail'] = $data;
    api_json($resp, 502);
}

api_json([
    'transaction_id' => $txId,
    'amount'         => $amount,
    'qr_base64'      => $qrBase64,    // já vem com prefixo data:image/png;base64,
    'qr_url'         => $qrUrl,
    'qr_copy_paste'  => $qrCopyPaste,
    'status'         => $data['transactionState'] ?? 'PENDENTE',
]);
