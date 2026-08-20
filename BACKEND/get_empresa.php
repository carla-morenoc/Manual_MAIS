<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

// Datos de conexión
$host = "maisfolmaisfol.mysql.db";
$db   = "maisfolmaisfol"; // Cambia esto al nombre correcto de la base de datos
$user = "maisfolmaisfol";      // O el usuario correcto
$pass = "Mais885551"; // Pon aquí la contraseña correcta

$mysqli = new mysqli($host, $user, $pass, $db);

if ($mysqli->connect_error) {
    die(json_encode([
        "success" => false,
        "error" => $mysqli->connect_error
    ]));
}

$result = $mysqli->query("SELECT * FROM empresas");

if (!$result) {
    die(json_encode([
        "success" => false,
        "error" => $mysqli->error
    ]));
}

$empresas = [];

while ($fila = $result->fetch_assoc()) {
    $empresas[] = $fila;
}

echo json_encode([
    "success" => true,
    "total" => count($empresas),
    "datos" => $empresas
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

$mysqli->close();