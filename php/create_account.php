<?php
$ip = $_SERVER['REMOTE_ADDR'];
$ua = $_SERVER['HTTP_USER_AGENT'];
$dir = "../accounts/";
file_exists($dir) || mkdir($dir);

foreach (glob($dir . "*.json") as $file) {
  $data = json_decode(file_get_contents($file), true);
  if ($data['ip'] === $ip && $data['ua'] === $ua) {
    echo json_encode(["error" => "You already created an account."]);
    exit;
  }
}

$hash = bin2hex(random_bytes(5));
$data = [
  "ip" => $ip,
  "ua" => $ua,
  "hash" => $hash
];
file_put_contents($dir . $hash . ".json", json_encode($data));
echo json_encode(["status" => "ok", "hash" => $hash]);
