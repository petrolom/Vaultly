<?php
session_start();
$user = $_SESSION['user'] ?? $_POST['username'] ?? '';
$id = $_POST['id'] ?? '';
$file = "../entries/$user.json";
if (!$user || !$id || !file_exists($file)) {
    echo json_encode(['status' => 'error']);
    exit;
}
$entries = json_decode(file_get_contents($file), true);
$entries = array_filter($entries, function($e) use ($id) {
    return $e['id'] !== $id;
});
file_put_contents($file, json_encode(array_values($entries)));
echo json_encode(['status' => 'ok']);
?>
