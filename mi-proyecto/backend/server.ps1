$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:3000/")
$listener.Start()

Write-Host "🛡️ SERVIDOR DE SEGURIDAD ACTIVO" -ForegroundColor Cyan

# Base de datos temporal (en memoria)
$usuarios = @{ "admin@gmail.com" = "123" }

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") { $response.StatusCode = 200 }
        elseif ($request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream)
            $body = $reader.ReadToEnd() | ConvertFrom-Json
            $resBody = @{ status = "error"; message = "No autorizado" }
            $code = 403

            # RUTA: REGISTRO (Nueva)
            if ($request.Url.LocalPath -eq "/auth/register") {
                if ($usuarios.ContainsKey($body.u)) {
                    $resBody = @{ message = "El usuario ya existe" }; $code = 400
                } else {
                    $usuarios[$body.u] = $body.p
                    $resBody = @{ status = "ok" }; $code = 200
                    Write-Host "👤 Nuevo usuario registrado: $($body.u)" -ForegroundColor Green
                }
            }
            # RUTA: LOGIN
            elseif ($request.Url.LocalPath -eq "/auth/login") {
                if ($usuarios[$body.u] -eq $body.p) {
                    $resBody = @{ status = "ok"; user = $body.u }; $code = 200
                }
            }
            # RUTA: PAGAR Y BORRAR (Igual que antes...)
            elseif ($request.Url.LocalPath -eq "/auth/pay") {
                if ($body.card.Length -eq 16) { $resBody = @{ status = "ok" }; $code = 200 }
            }
            elseif ($request.Url.LocalPath -eq "/auth/delete") {
                if ($body.currentUser -eq $body.owner) { $resBody = @{ status = "ok" }; $code = 200 }
            }

            $buffer = [System.Text.Encoding]::UTF8.GetBytes(($resBody | ConvertTo-Json))
            $response.ContentType = "application/json"
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        $response.Close()
    }
} finally { $listener.Stop() }