<?php
session_start();
$user = $_SESSION['user'] ?? $_POST['username'] ?? '';
if (!$user) {
    echo json_encode(['entries' => []]);
    exit;
}
$file = "../entries/$user.json";
$entries = [];
if (file_exists($file)) {
    $entries = json_decode(file_get_contents($file), true);
}
echo json_encode(['entries' => $entries]);
?>
