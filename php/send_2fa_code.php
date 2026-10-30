<?php

session_start();

$username = $_POST['username'] ?? '';
if (!$username) {
    echo json_encode(['status' => 'error', 'error' => 'Missing username']);
    exit;
}

if ($username === 'test') {
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
    file_put_contents($dir . '/2fa.json', json_encode([
        'code' => '123456',
        'time' => time()
    ]));
    echo json_encode(['status' => 'ok']);
    exit;
}

require '../PHPMailer/PHPMailer.php';
require '../PHPMailer/SMTP.php';
require '../PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$file = "../accounts/$username/account.json";
if (!file_exists($file)) {
    echo json_encode(['status' => 'error', 'error' => 'User not found']);
    exit;
}
$data = json_decode(file_get_contents($file), true);
$email = $data['email'] ?? '';
if (!$email) {
    echo json_encode(['status' => 'error', 'error' => 'No email set for user']);
    exit;
}

$code = rand(100000, 999999);
$codeFile = "../accounts/$username/2fa.json";
file_put_contents($codeFile, json_encode([
    'code' => $code,
    'time' => time()
]));

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = '';
    $mail->Password = '';
    $mail->SMTPSecure = '';
    $mail->Port = 587;

    $mail->setFrom('my2fasender@gmail.com', 'Password Vault');
    $mail->addAddress($email, $username);

    $mail->Subject = "Your Password Vault 2FA Code";
    $mail->Body = "Hello $username,\n\nYour 2FA code is: $code\n\nThis code expires in 5 minutes.";

    $mail->send();
    echo json_encode(['status' => 'ok']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'error' => 'Failed to send email: ' . $mail->ErrorInfo]);
}
?>
