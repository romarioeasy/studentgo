<?php
/**
 * Panelas Pará - Helpers
 *
 * Funções utilitárias usadas pelos endpoints PHP.
 */

/**
 * Configura cabeçalhos CORS e responde a requisições OPTIONS.
 */
function api_setup_cors(string $allowedOrigin): void
{
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Retorna resposta JSON e encerra a execução.
 */
function api_json($data, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Retorna o JSON do corpo da requisição como array.
 */
function api_input(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Sanitiza string removendo tags e espaços extra.
 */
function clean_str($value, int $max = 255): string
{
    if (!is_string($value)) return '';
    $value = trim(strip_tags($value));
    return mb_substr($value, 0, $max);
}

/**
 * Mantém apenas dígitos.
 */
function only_digits($value): string
{
    return preg_replace('/\D+/', '', (string)$value);
}

/**
 * Validação de CPF (algoritmo dos dígitos verificadores).
 */
function valid_cpf(string $cpf): bool
{
    $cpf = only_digits($cpf);
    if (strlen($cpf) !== 11) return false;
    if (preg_match('/^(\d)\1{10}$/', $cpf)) return false;

    for ($t = 9; $t < 11; $t++) {
        $sum = 0;
        for ($i = 0; $i < $t; $i++) {
            $sum += (int)$cpf[$i] * (($t + 1) - $i);
        }
        $check = ((10 * $sum) % 11) % 10;
        if ((int)$cpf[$t] !== $check) return false;
    }
    return true;
}

/**
 * Faz uma chamada HTTP via cURL e retorna [status, body, error, info].
 */
function http_request(string $method, string $url, array $headers = [], $body = null): array
{
    if (!function_exists('curl_init')) {
        return [
            'status' => 0,
            'body'   => '',
            'error'  => 'A extensão cURL do PHP não está disponível neste servidor.',
            'info'   => [],
        ];
    }

    $ch = curl_init($url);

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_FOLLOWLOCATION => true,
    ]);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : json_encode($body));
    }

    $response = curl_exec($ch);
    $info     = curl_getinfo($ch);
    $error    = curl_error($ch);
    curl_close($ch);

    return [
        'status' => (int)($info['http_code'] ?? 0),
        'body'   => $response,
        'error'  => $error,
        'info'   => $info,
    ];
}

/**
 * Grava uma linha no log do backend.
 *
 * Caminho: api/logs/api.log (a pasta logs/ é criada automaticamente
 * e protegida por um .htaccess que bloqueia acesso direto).
 */
function api_log(string $tag, $data): void
{
    $dir = __DIR__ . '/logs';
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
        @file_put_contents($dir . '/.htaccess', "Require all denied\n");
    }

    $line = '[' . date('Y-m-d H:i:s') . '] ' . $tag . ' '
          . (is_string($data) ? $data : json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))
          . PHP_EOL;

    @file_put_contents($dir . '/api.log', $line, FILE_APPEND | LOCK_EX);
}
