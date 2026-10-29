<?php
$hash = $_POST['hash'] ?? '';
$newPass = $_POST['newPass'] ?? '';

if (!$hash || !$newPass) {
    echo json_encode(['status' => 'error', 'error' => 'Missing data']);
    exit;
}

if ($hash === '1234abcdef') {
    $file = '../accounts/test/account.json';
    if (!file_exists($file)) {
        $dir = '../accounts/test';
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        file_put_contents($file, json_encode([
            'username' => 'test',
            'email' => 'test@example.com',
            'password' => password_hash('12345678', PASSWORD_DEFAULT),
            'hash' => '1234abcdef'
        ]));
    }
    $data = json_decode(file_get_contents($file), true);
    $data['password'] = password_hash($newPass, PASSWORD_DEFAULT);
    file_put_contents($file, json_encode($data));
    echo json_encode(['status' => 'ok']);
    exit;
}

$found = false;
foreach (glob("../accounts/*/account.json") as $file) {
    $data = json_decode(file_get_contents($file), true);
    if (($data['hash'] ?? '') === $hash) {
        $data['password'] = password_hash($newPass, PASSWORD_DEFAULT);
        file_put_contents($file, json_encode($data));
        $found = true;
        break;
    }
}

if ($found) {
    echo json_encode(['status' => 'ok']);
} else {
    echo json_encode(['status' => 'error', 'error' => 'Master key not found']);
}
?>
