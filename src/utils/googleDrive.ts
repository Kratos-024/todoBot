import fs from "fs";
import { google } from "googleapis";
let apiKeys: any;

export class Drive {
  constructor() {}
  async authorize() {
    let authClient;

    authClient = new google.auth.JWT(
      "unikitab@proven-cosmos-452316-c3.iam.gserviceaccount.com",
      undefined,
      "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCtkjoIqwLsFVro\nkp2Auoz9Q2CLcc4F0HE+hfpRolyi62rdof2Rke9klEhUW2bpHGebuM05WBuIX3F6\nc7cTt3wvHMTqxa+eEs1Um3HRHRwFwWcC7HcpXHawt7UMBBUiT7nKVV67wke4gxRo\nPRMX5B3f+JMjU/EMfEwiK2ZTP0rFMZZBr2RToV6wf1HMqp/gLqP45s6B0I0NxyPr\ncIwrPNfWoXaH+S4XQGrQnmpmfbFx9ehsh0TIxvcTsr2+zDIFfyUx9Cvs4tmB6HgR\nE7b/KLhGIu9mJ/ddoCLVIJbM7BTUjoDOrcEA2Pyv7oTs9YtDCcIGGzKHWYhxNcnU\nw2VgjHfbAgMBAAECggEAIHtbefDK6LRsYVbCu+rtZJ39zMq84/CoqKs495r7XA/T\nXWupwNq/IqLvUD4Uqa5Do2w3l7Ip4OD/owtRqRJu3oAzR748Cch5/YnjiF86tccG\nSJFJEYf4vER80KVY8SVbXwaP5nJKqrh5ErLPRmrNvnLN0lAsrYn7U2+sxAp1qyY3\n9HSf4/8ESjgX9L8/XJtauto51Fqs+douCMEG8mE5y1vrbGzDHbhMUj1dgDcsfBSi\n/LUW3JMyI/mie7f6w+5WoH1hG4Giia6dzw1ZLPXBo5ZHcH+uCi4iJuW+TQETFGUp\nuYViNIqMMROP/KbiqaIE8oW+zuFQecZqDmtKuyT5RQKBgQDewtwuyOgSOfW1qMIY\nS+dCgR0PFPdv0zNuLTFprrz7/GogtcaS0/fYZX1gOuR6iiPlBTl0DFAuV97X+1f5\noHTv2g3wcpvPFz6sEOadGBNkWZtY7x70P4/z9m7RH77ea/a4zKMxcEFnL4kC0eUv\nplQFb97Ozcax+1QxMLHCgUDU7QKBgQDHeGJMapy89Fp+zmWUOJP/2Y8vHcUJo4Dq\nexXtPZgkJSg3lDibULzzLPbxnHo2qQKdgOnyI/EjfK4uL7FpGrKXeNurHuEAOVDQ\nfCOetnXiq0AQpAkS8TlOkLbRwcVLFYspMKN2jL8E5kYHsKeb/CDQlSLSx0Y5uKrh\na0FMEnju5wKBgFFyecL5XjDb1ET5UQ5FImckghVzmwzd8d4E1B5J73tKzRrsm5Av\nxFzwrqiyn7tWKs2f3WPa5K4tHqNlmMMCsf7IgXQ601EitJ2BCHDDzsNQKAaaV30C\niIWwws/fhZAZdXoYCEsZOjCaJsRLLjr/25SpVJPUlSOaOyxJG5V8YNH5AoGAFDsi\nhSufAA8sioX2iYT/hciUHCxByst5jM61F53Sq3/VR2XSI/aZY3ShCzparuaPbFgh\n4jxA/d9sbyTJMqbRjElmxkFYgsRNbQfaOQO6iyXhVo68mN48eLp2wGmN0CK8PY5A\nVgrKaP3OBoOlTE3TKjSmFoi9l6ciNcDCG6wX9esCgYBNGOkC2T2a7NTKzLDxBdwv\ngK+doN67UmOw4KEEUAUANfel9G9e7K0wp90I0brYDPMdJmjSFkUQdg62oSJXCohK\nAwYjSGmP6Y8q+24mq+FkgoCNIWfYCz7t7E9fZBlhq1tomSq9e+9j6WJNv3k0Re0u\nQmbKn2nUo3jJ0lMXoTZGAQ==\n-----END PRIVATE KEY-----\n",
      ["https://www.googleapis.com/auth/drive.file"]
    );

    return authClient;
  }

  async uploadFile(authClient: any, filePath: string, fileName: string) {
    const drive = google.drive({ version: "v3", auth: authClient });

    const fileMetadata = {
      name: `${fileName}`,
      parents: ["1KVcvPwe8gOuXcgpM4zxnSJuogeD1C6OA"],
    };

    const media = {
      mimeType: "application/pdf",
      body: fs.createReadStream(`${filePath}`),
    };

    try {
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id",
      });

      return response.data.id;
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      throw error;
    }
  }

  async getFileUrl(auth: any, fileId: string): Promise<string | null> {
    try {
      const drive = google.drive({ version: "v3", auth });

      const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: "id, name, mimeType, webViewLink",
      });

      if (fileMetadata.data.webViewLink) {
        return fileMetadata.data.webViewLink;
      }

      const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;
      return webViewLink;
    } catch (error) {
      console.error("Error getting file URL:", error);
      return null;
    }
  }

  async getFileStream(auth: any, fileId: string) {
    try {
      const drive = google.drive({ version: "v3", auth });

      const response = await drive.files.get(
        {
          fileId: fileId,
          alt: "media",
        },
        { responseType: "stream" }
      );

      return response.data;
    } catch (error) {
      console.error("Error getting file stream:", error);
      return null;
    }
  }

  async getFile(auth: any, fileId: string) {
    try {
      const drive = google.drive({ version: "v3", auth });

      const response = await drive.files.get({
        fileId: fileId,
        fields: "id,name,mimeType,webContentLink,webViewLink",
      });

      return response.data;
    } catch (error) {
      console.error("Error getting file metadata:", error);
      return null;
    }
  }

  async getDirectDownloadUrl(
    auth: any,
    fileId: string
  ): Promise<string | null> {
    try {
      const drive = google.drive({ version: "v3", auth });

      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      const file = await drive.files.get({
        fileId: fileId,
        fields: "webContentLink",
      });

      if (file.data.webContentLink) {
        const directUrl = file.data.webContentLink.replace(
          "&export=download",
          ""
        );
        return directUrl;
      }

      return null;
    } catch (error) {
      console.error("Error generating direct download URL:", error);
      return null;
    }
  }
}
