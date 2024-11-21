import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
export async function getChequeInfo(path){
        try{
          console.log(path)
        const fileManager = new GoogleAIFileManager(process.env.API_KEY);
        console.log(process.env.API_KEY)
        const uploadResult = await fileManager.uploadFile(
          path,
          {
            mimeType: "image/jpeg",
            displayName: "Jetpack drawing",
          },
        );
        console.log(
          `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
        );
        
        const genAI = new GoogleGenerativeAI(process.env.API_KEY);
        const safetySettings = [
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_NONE},
              {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_NONE
            },
        
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY,
                threshold: HarmBlockThreshold.BLOCK_NONE
              }
            
          ];
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }, safetySettings);
        const result = await model.generateContent([
         `Please extract the following details from the provided text and format it as JSON:
          '{
            "chequeNum": "<cheque number>",
            "owner": "<name of the owner>",
            "date": "<date in yyyy-MM-dd format>",
            "amount": "<amount>",
            "BankName": "<complete bank name>"
          }'
        Only respond with this JSON format, without extra text no return line no spaces, the owner of the cheque will be bellow the syntese "Titulaire de compte" or "N° du compte" note that the owner of the cheque is not in front the word 'a l'ordre de , and the amount is always in the top right corener written with hand.
            `,
          {
            fileData: {
              fileUri: uploadResult.file.uri,
              mimeType: uploadResult.file.mimeType,
            },
          },
        ]);

        var responseText=result.response.text()
        responseText = responseText
            .replace(/```json\n|```|\\n/g, '')  // Remove markdown json formatting, extra backslashes, and newlines
            .trim();

        // Attempt to parse cleaned text as JSON
        const json=JSON.parse(responseText)
        return json;

    }
    catch(e){
        throw new Error(e)
    }
    
}