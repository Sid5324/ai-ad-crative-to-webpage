$filePath = "D:\ai\imp\ai ad crative to webpage\project.zip"
$deployEndpoint = "https://claude-skills-deploy.vercel.com/api/deploy"

$file = Get-Item $filePath
$boundary = [System.Guid]::NewGuid().ToString()

$body = (
    "--$boundary`r`n" +
    "Content-Disposition: form-data; name=`"file`"; filename=`"$($file.Name)`"; filename*=utf-8`"$($file.Name)`"`r`n" +
    "Content-Type: application/zip`r`n`r`n" +
    [System.IO.File]::ReadAllBytes($file.FullName) +
    "`r`n--$boundary`r`n" +
    "Content-Disposition: form-data; name=`"framework`"`r`n`r`n" +
    "nextjs`r`n--$boundary--`r`n"
)

$response = Invoke-RestMethod -Uri $deployEndpoint -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $body

$response | ConvertTo-Json