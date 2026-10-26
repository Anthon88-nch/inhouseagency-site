<?php
/**
 * Обработчик формы заявки для PHP-хостинга (Beget и т.п.).
 * На GitHub Pages PHP не работает — там заявка автоматически уходит в WhatsApp (см. assets/js/main.js).
 *
 * Настрой:
 *   MAIL_TO   — куда слать заявки
 *   MAIL_FROM — адрес отправителя на твоём домене (на Beget лучше создать такой ящик)
 *   TG_TOKEN / TG_CHAT — по желанию, чтобы заявки падали в Telegram
 */
const MAIL_TO   = 'info@i-tend.ru';
const MAIL_FROM = 'noreply@inhouseagency.ru';
const TG_TOKEN  = '';
const TG_CHAT   = '';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

$d = json_decode(file_get_contents('php://input'), true);
if (!is_array($d)) $d = $_POST;

$clean = function ($v, $len = 300) {
    $v = trim(strip_tags((string)($v ?? '')));
    $v = preg_replace('/[\r\n]+/u', ' ', $v);
    return mb_substr($v, 0, $len);
};

// Антиспам: скрытое поле и слишком быстрая отправка
if (!empty($d['company']) || (int)($d['elapsed'] ?? 0) < 2500) {
    echo json_encode(['ok' => true]);
    exit;
}

$name    = $clean($d['name'] ?? '', 100);
$phone   = $clean($d['phone'] ?? '', 30);
$site    = $clean($d['site'] ?? '', 200);
$need    = $clean($d['need'] ?? '', 300);
$message = mb_substr(trim(strip_tags((string)($d['message'] ?? ''))), 0, 2000);

if ($name === '' || strlen(preg_replace('/\D/', '', $phone)) !== 11) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'validation']);
    exit;
}

$lines = [
    'Заявка с сайта inhouseagency.ru',
    '',
    'Имя: ' . $name,
    'Телефон: ' . $phone,
];
if ($site !== '')    $lines[] = 'Сайт: ' . $site;
if ($need !== '')    $lines[] = 'Что нужно: ' . $need;
if ($message !== '') $lines[] = "Задача:\n" . $message;
$lines[] = '';
$lines[] = 'Время: ' . date('d.m.Y H:i');
$body = implode("\n", $lines);

$sent = false;

// Почта
$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $name) . '?=';
$headers = implode("\r\n", [
    'From: inhouse agency <' . MAIL_FROM . '>',
    'Reply-To: ' . MAIL_FROM,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);
if (@mail(MAIL_TO, $subject, $body, $headers)) $sent = true;

// Telegram
if (TG_TOKEN !== '' && TG_CHAT !== '') {
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/x-www-form-urlencoded',
        'content' => http_build_query(['chat_id' => TG_CHAT, 'text' => $body]),
        'timeout' => 5,
    ]]);
    $res = @file_get_contents('https://api.telegram.org/bot' . TG_TOKEN . '/sendMessage', false, $ctx);
    if ($res && (json_decode($res, true)['ok'] ?? false)) $sent = true;
}

echo json_encode(['ok' => $sent]);
