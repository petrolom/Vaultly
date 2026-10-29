<?php
session_start();
$user = $_SESSION['user'] ?? $_POST['username'] ?? '';
if (!$user) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}
$dir = "../entries";
if (!is_dir($dir)) {
    mkdir($dir, 0700, true);
}
$file = "$dir/$user.json";
$entries = [];
if (file_exists($file)) {
    $entries = json_decode(file_get_contents($file), true);
}
$id = uniqid();
$entries[] = [
    'id' => $id,
    'name' => $_POST['name'],
    'user' => $_POST['user'],
    'pass' => $_POST['pass']
];
file_put_contents($file, json_encode($entries));
echo json_encode(['status' => 'ok']);
?>
