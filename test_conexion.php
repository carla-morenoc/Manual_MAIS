<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$host = "maisfolmaisfol.mysql.db";
$db   = "maisfolmaisfol";
$user = "maisfolmaisfol";
$pass = "Mais885551";
$port = 3306;

$mysqli = new mysqli($host, $user, $pass, $db, $port);

if ($mysqli->connect_error) {
    die("ERROR: " . $mysqli->connect_error);
}

echo "Conectado correctamente";