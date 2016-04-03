<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="windows-1252">
		<title>SMC+ POST sample</title>
	</head>

	<body>

		<div id="referer">Referer: <?php print($_SERVER["HTTP_REFERER"] ); ?></div>
		<div id="ua"><?php print($_SERVER['HTTP_USER_AGENT']); ?></div>
		<pre id="data">Data:<?php print_r($_POST); ?></pre>

	</body>
</html>
