<?php
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 1);
error_reporting(E_ALL);
// Datos de conexión
$host = "maisfolmaisfol.mysql.db";
$db   = "maisfolmaisfol"; // Cambia esto al nombre correcto de la base de datos
$user = "maisfolmaisfol";      // O el usuario correcto
$pass = "Mais885551"; // Pon aquí la contraseña correcta

$port = 3306;

$mysqli = new mysqli($host, $user, $pass, $db, $port);
$mysqli->set_charset('utf8mb4');

if ($mysqli->connect_error) {
    echo json_encode(["error" => "Error de conexión: " . $mysqli->connect_error]);
    exit;
}

$empresa = trim($_POST['empresa'] ?? '');

if ($empresa == '') {
    echo json_encode(["error" => "El nombre de la empresa es obligatorio"]);
    exit;
}

$stmt = $mysqli->prepare("
    INSERT INTO empresas (empresa, ultima_conexion, conexiones)
    VALUES (?, NOW(), 1)
    ON DUPLICATE KEY UPDATE
        ultima_conexion = NOW(),
        conexiones = conexiones + 1
");

if (!$stmt) {
    echo json_encode(["error" => "Error al preparar la consulta: " . $mysqli->error]);
    exit;
}

$stmt->bind_param("s", $empresa);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "empresa" => $empresa
    ]);
} else {
    echo json_encode(["error" => "Error al ejecutar: " . $stmt->error]);
}

$stmt->close();
$mysqli->close();
?>