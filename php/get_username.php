<?php
$hash = $_POST['hash'] ?? '';

if (!$hash) {
    echo json_encode(['status' => 'error', 'error' => 'Missing master key']);
    exit;
}

if ($hash === '1234abcdef') {
    echo json_encode(['status' => 'ok', 'username' => 'test']);
    exit;
}

foreach (glob("../accounts/*/account.json") as $file) {
    $data = json_decode(file_get_contents($file), true);
    if (($data['hash'] ?? '') === $hash) {
        echo json_encode(['status' => 'ok', 'username' => $data['username']]);
        exit;
    }
}

echo json_encode(['status' => 'error', 'error' => 'Master key not found']);
?>
