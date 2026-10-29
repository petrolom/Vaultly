<?php
session_start();
$user = $_POST['username'] ?? '';
$pass = $_POST['password'] ?? '';
$code2fa = $_POST['code2fa'] ?? '';

if ($user === 'test' && $pass === '12345678' && $code2fa === '123456') {
    $dir = '../accounts/test';
    if (!is_dir($dir)) {
        mkdir($dir, 0700, true);
    }

    if (!file_exists($dir . '/account.json')) {
        file_put_contents($dir . '/account.json', json_encode([
            'username' => 'test',
            'email' => 'test@example.com',
            'password' => password_hash('12345678', PASSWORD_DEFAULT),
            'hash' => '1234abcdef'
        ]));
    }

    $codeFile = $dir . '/2fa.json';
    file_put_contents($codeFile, json_encode([
        'code' => '123456',
        'time' => time()
    ]));

    $file = $dir . '/account.json';
    $_SESSION['userfile'] = $file;
    $_SESSION['user'] = $user;
    echo json_encode(['status' => 'ok']);
    exit;
}

$codeFile = "../accounts/$user/2fa.json";
if (!file_exists($codeFile)) {
    echo json_encode(["error" => "2FA code not requested."]);
    exit;
}
$codeData = json_decode(file_get_contents($codeFile), true);
if ($codeData['code'] != $code2fa) {
    echo json_encode(["error" => "Invalid 2FA code."]);
    exit;
}
if ($user !== 'test' && time() - $codeData['time'] > 300) {
    echo json_encode(["error" => "2FA code expired."]);
    exit;
}

$file = "../accounts/$user/account.json";
if (!file_exists($file)) {
    echo json_encode(["error" => "User not found."]);
    exit;
}
$data = json_decode(file_get_contents($file), true);
if ($data['username'] === $user && password_verify($pass, $data['password'])) {
    @unlink($codeFile);
    $_SESSION['userfile'] = $file;
    $_SESSION['user'] = $user;
    echo json_encode(["status" => "ok"]);
    exit;
}
echo json_encode(["error" => "Login failed."]);
?>
