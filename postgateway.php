<?php

function docurl($request) {
	$curl = curl_init();
	curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.108 Safari/537.36');
	curl_setopt($curl, CURLOPT_URL, $request['url']);
	curl_setopt($curl, CURLOPT_REFERER, $request['referer']);
	curl_setopt($curl, CURLOPT_POST, count($request['data']));
	curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($request['data']));

	curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	// curl_setopt($curl, CURLOPT_VERBOSE, 1);
	curl_setopt($curl, CURLOPT_HEADER, 1);

	$response = curl_exec($curl);
	$error = curl_error($curl);
	$result = array('header' => '', 
	                'body' => '', 
	                'curl_error' => '', 
	                'http_code' => '',
	                'last_url' => '');
	if ( $error != "" )
	{
	    $result['curl_error'] = $error;
	    return $result;
	}

	$header_size = curl_getinfo($curl, CURLINFO_HEADER_SIZE);
	$result['header'] = substr($response, 0, $header_size);
	$result['body'] = substr( $response, $header_size);
	$result['http_code'] = curl_getinfo($curl, CURLINFO_HTTP_CODE);
	$result['last_url'] = curl_getinfo($curl, CURLINFO_EFFECTIVE_URL);
	curl_close($curl);

    return $result;
}


$request = $_POST;
$request = array(
	'url' => 'http://localhost/~luis/SMC+/postsample.php',
	'url' => 'http://castello.es/web30/pages/seccion_web10.php?cod1=383',
	'data' => array(
		'foo' => 1,
		'bar' => 2
	),
	'referer' => 'http://localhost/~luis/SMC+/postsample.php',
	'referer' => 'http://castello.es/web30/pages/seccion_web10.php?cod1=383',
	'iconv' => array('utf-8', 'windows-1252'),
	'base' => 'http://castello.es/'
);

// charset conversion for data
if (array_key_exists('iconv', $request)) {
	$from = $request['iconv'][0];
	$to = $request['iconv'][1];

	$tmp = [];

	foreach($request['data'] as $k => $v) {
		$tmp[$k] = iconv($from, $to, $v);
	}
	$request['data'] = $tmp;
}


function is_not_empty($s) {
	return $s != "";
}

$response = docurl($request);

$headers = preg_split('/[\r\n]/', $response['header']);
$headers = array_filter($headers, "is_not_empty");
foreach ($headers as $h) {
	if ("Transfer-Encoding: chunked" == substr($h, 0, 26)) {
		continue;
	}
	header($h);
}

if (array_key_exists('base', $request)) {
	$base_tag = '<base href="'.$request['base'].'">';
	$response['body'] = preg_replace('/<head>/', '<head>' . $base_tag, $response['body']);
}

print($response['body']);
