<?php
session_start();
$username = $_POST['username'] ?? '';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$hash = $_POST['hash'] ?? '';

if (!$username || !$email || !$password || !$hash) {
    echo json_encode(['status' => 'error', 'error' => 'Missing data']);
    exit;
}

if (strtolower($username) === 'test') {
    echo json_encode(['status' => 'error', 'error' => 'This username is reserved.']);
    exit;
}

$dir = "../accounts/$username";
if (is_dir($dir)) {
    echo json_encode(['status' => 'error', 'error' => 'Username already exists!']);
    exit;
}

mkdir($dir, 0700, true);
$data = [
    'username' => $username,
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
    'hash' => $hash
];
file_put_contents("$dir/account.json", json_encode($data));
echo json_encode(['status' => 'ok']);
?>