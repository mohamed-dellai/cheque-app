param (
    [string]$chequeId
)
Add-Type -AssemblyName System.Drawing

# Initialize WIA (Windows Image Acquisition) CommonDialog
$wiaDialog = New-Object -ComObject WIA.CommonDialog
$wiaManager = New-Object -ComObject WIA.DeviceManager

# Find the first scanner connected
$wiaDevice = $wiaManager.DeviceInfos | Where-Object { $_.Type -eq 1 } | Select-Object -First 1

if ($null -eq $wiaDevice) {
    exit
}

# Connect to the scanner device
$wiaDevice = $wiaDevice.Connect()

# Define paths for scanned and final image files
$tempPath = "C:\Users\Mohamed Dellai\Desktop\CHEQUE APP\my-next-app\public\scanned\$chequeId-uncompressed.jpg"
$finalSavePath = "C:\Users\Mohamed Dellai\Desktop\CHEQUE APP\my-next-app\public\scanned\$chequeId.jpg"

# Ensure C:\temp directory exists
if (!(Test-Path -Path "C:\temp")) {
    New-Item -ItemType Directory -Path "C:\temp"
}

# Set DPI and Color settings
$wiaItem = $wiaDevice.Items[1]  # First item in device
$wiaItem.Properties["6147"].Value = 300  # DPI setting
$wiaItem.Properties["6146"].Value = 2    # Color mode
$wiaItem.Properties["4104"].Value = 24   # 24 Bits Per Pixel
# Set the scanning area (adjust dimensions based on cheque size and scanner specs)
$wiaItem.Properties["6149"].Value = 0     # Horizontal start position
$wiaItem.Properties["6150"].Value = 0     # Vertical start position
$wiaItem.Properties["6151"].Value = 2200  # Width (horizontal extent)
$wiaItem.Properties["6152"].Value = 1100 # Height (vertical extent)
# Scan and save image temporarily
$image = $wiaItem.Transfer()
$image.SaveFile($tempPath)

# Check if the image file was created
if (Test-Path -Path $tempPath) {
    # Load the image with System.Drawing
    $bitmap = [System.Drawing.Image]::FromFile($tempPath)

    # Configure JPEG encoding to reduce file size
    $jpegEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq 'JPEG' }
    $encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 50L) # Adjust compression level here

    # Save the compressed image
    $bitmap.Save($finalSavePath, $jpegEncoder, $encoderParameters)
    $bitmap.Dispose()
    
    # Delete uncompressed temp file
    Remove-Item -Path $tempPath -Force

    # Output only the file name for further processing
    Write-Output "$chequeId.jpg"
} else {
    Write-Output "Failed to save the scanned image. Check scanner and directory permissions."
    exit
}
