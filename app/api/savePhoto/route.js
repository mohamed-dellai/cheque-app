import { NextResponse } from 'next/server';
import { exec } from 'child_process'; // Import exec to run the PowerShell script
import path from 'path'; // Import path module
import {getChequeInfo} from './getInfo';

export async function POST(req) {
    try {
        const body = await req.json();
        const chequeId = body.chequeNum;
        const scriptPath = path.join('C:\\Users\\Mohamed Dellai\\Desktop\\CHEQUE APP\\my-next-app\\app\\api\\savePhoto', 'scanner.ps1');
        const scannedFilePath = await saveImage(chequeId, scriptPath);
        const resJson=await getChequeInfo('public\\scanned\\'+scannedFilePath)
        resJson['path']=scannedFilePath
        return NextResponse.json(resJson, { status: 200 });

    } catch (error) {
        console.error('Error extracting cheque ID:', error);
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}




function saveImage(chequeId, scriptPath) {
    return new Promise((resolve, reject) => {
        exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" -chequeId "${chequeId}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing PowerShell script: ${error.message}`);
                reject(error); // Reject the promise on error
                return;
            }
            if (stderr) {
                console.error(`PowerShell error: ${stderr}`);
                reject(new Error(stderr)); // Reject the promise on stderr
                return;
            }

            const scannedFilePath = stdout.trim(); 
            console.log(scannedFilePath)
            resolve(scannedFilePath); // Resolve the promise with the scanned file path
        });
    });
}

