<?php
ob_clean();   
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$host = "172.22.52.50:3306";
$db   = "maisfol";   
$user = "maisfol";      
$pass = "mais#800401";          

$mysqli = new mysqli($host, $user, $pass, $db);
if ($mysqli->connect_error) {
    die(json_encode(["error" => $mysqli->connect_error]));
}

// Recibir datos del POST
$empresa     = $_POST['empresa']       ?? null;


// Validación básica
if (!$empresa) {
    echo json_encode(["error" => "El nombre de la empresa es obligatorio"]);
    exit;
}


// Preparar INSERT
$stmt = $mysqli->prepare("
    INSERT INTO empresas (empresa)
    VALUES (?)
");

$stmt->bind_param(
    "s",
    $empresa
);

if ($stmt->execute()) {
    echo json_encode([
        "success"    => true,
        "id"  => $stmt->insert_id,
        "empresa"    => $empresa

    ]);
} else {
    echo json_encode(["error" => $stmt->error]);
}

$stmt->close();
$mysqli->close();
?>
