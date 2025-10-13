import { sp } from "@pnp/sp";

export interface IAttachmentFileInfo {
  name: string;
  content: ArrayBuffer;
  size: number;
  isFileExists: boolean;
}

export default class FileUploadService {
  private siteUrl: string;
  private serverRelativeSiteUrl: string;
  private libraryName: string;

  constructor(siteUrl: string, serverRelativeSiteUrl: string, libraryName: string) {
    this.siteUrl = siteUrl;
    this.serverRelativeSiteUrl = serverRelativeSiteUrl;
    this.libraryName = libraryName;

    sp.setup({ sp: { baseUrl: this.siteUrl } });
  }
  public async uploadFiles( files: IAttachmentFileInfo[], FormsMetadata?: { metadata: Record<string, any>, isValid: boolean }, shouldResolveConflicts: boolean = false, itemId?: number ): Promise<boolean> {
    const { year, month } = this.getCurrentYearMonth();
    const folderUrl = `${this.serverRelativeSiteUrl}/${this.libraryName}/${year}/${month}`;

    await this.ensureFolderPathExists(folderUrl);
    const finalFiles = shouldResolveConflicts ? await this.resolveNameConflicts(files, folderUrl) : files;

    let uploadedCount = 0;

    for (const file of finalFiles) {
      try {
        if (typeof itemId === "number" && itemId > 0) {
          // ✅ Get existing item and file reference
          const item = await sp.web.lists .getByTitle(this.libraryName) .items.getById(itemId) .select("ID", "FileLeafRef", "FileRef") .get();       
          const existingFileUrl = item.FileRef;
          // ✅ Overwrite existing file content
          await sp.web.getFileByServerRelativeUrl(existingFileUrl).setContent(file.content);
         
          // ✅ Update metadata regardless of file name match
          await sp.web.lists.getByTitle(this.libraryName).items.getById(itemId).update(FormsMetadata?.metadata ?? {});
        } else {
          // ✅ Create mode: upload and update metadata
          const uploadedFile = await this.uploadSingleFile(folderUrl, file);
         console.log(uploadedFile.data.ServerRelativeUrl);

          await this.updateMetadata(uploadedFile.data.ServerRelativeUrl, file.name, FormsMetadata?.metadata);
        }
        uploadedCount++;
      } catch (error) {
        console.error("Error uploading or updating file:", file.name, error);
        throw error;
      }
    }

    return uploadedCount === finalFiles.length;
  }


  // public async uploadFiles( files: IAttachmentFileInfo[], FormsMetadata?: { metadata: Record<string, any>, isValid: boolean }, shouldResolveConflicts: boolean = false, itemId?: number): Promise<boolean> {
  //   const { year, month } = this.getCurrentYearMonth();
  //   const folderUrl = `${this.serverRelativeSiteUrl}/${this.libraryName}/${year}/${month}`;

  //   await this.ensureFolderPathExists(folderUrl);

  //   const finalFiles = shouldResolveConflicts ? await this.resolveNameConflicts(files, folderUrl) : files;
  //   let uploadedCount = 0;

  //   for (const file of finalFiles) {
  //     try {
  //       if (typeof itemId === "number" && itemId > 0) {            
  //         // ✅ Replace file for existing item
  //         const item = await sp.web.lists.getByTitle(this.libraryName).items.getById(itemId).select("ID", "FileLeafRef", "FileRef").get(); 
  //         console.log(item);       
  //         const isFileNameMatched = file.name.toLowerCase() === item.FileLeafRef.toLowerCase();
  //         if(isFileNameMatched) {            
  //           // ✅ Update metadata for existing item
  //           await sp.web.lists.getByTitle(this.libraryName).items.getById(itemId).update(FormsMetadata?.metadata ?? {});
  //         } else {              
  //           // Delete existing file
  //           await sp.web.getFileByServerRelativeUrl(item.FileRef).delete();

  //           // Upload new file to same folder
  //           const uploadedFile = await this.uploadSingleFile(folderUrl, file);
  //           await this.updateMetadata(uploadedFile.data.ServerRelativeUrl, file.name, FormsMetadata?.metadata);
  //         }
  //       }
  //       const uploadedFile = await this.uploadSingleFile(folderUrl, file);
  //       console.log(uploadedFile.data.ServerRelativeUrl);
  //       await this.updateMetadata(uploadedFile.data.ServerRelativeUrl, file.name, FormsMetadata?.metadata);
  //       uploadedCount++;
  //     } catch (error) {
  //       console.error("Error uploading file:", file.name, error);
  //       throw error;
  //     }
  //   }
  //   return uploadedCount === finalFiles.length;
  // }

  private async uploadSingleFile(folderUrl: string, file: IAttachmentFileInfo): Promise<any> {
    const folder = sp.web.getFolderByServerRelativeUrl(folderUrl);
    if (file.size <= 10 * 1024 * 1024) {
      return await folder.files.add(file.name, file.content, true);
    } else {
      const blob = new Blob([file.content]);
      return await folder.files.addChunked(file.name, blob);
    }
  }

  private async updateMetadata( fileUrl: string, originalName: string, metadata?: Record<string, any> ): Promise<void> {
    try {
      const item = await sp.web.getFileByServerRelativeUrl(fileUrl).getItem();
      const updatePayload: Record<string, any> = {
        Title: originalName
      };

      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          updatePayload[key] = value;
        }
      }

      await item.update(updatePayload);
    } catch (error) {
      console.warn("Metadata update failed for:", fileUrl, error);
    }
  } 

  private async ensureFolderPathExists(folderUrl: string): Promise<void> {
    const baseFolder = `${this.serverRelativeSiteUrl}/${this.libraryName}`;
    const relativePath = folderUrl.replace(`${baseFolder}/`, "");
    const folders = relativePath.split("/").filter(Boolean);

    let currentPath = baseFolder;
    for (const folder of folders) {
      currentPath += `/${folder}`;
      try {
        await sp.web.getFolderByServerRelativeUrl(currentPath)();
      } catch {
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
        await sp.web.getFolderByServerRelativeUrl(parentPath).folders.add(folder);
      }
    }
  }

  public async resolveNameConflicts( files: IAttachmentFileInfo[], folderUrl: string ): Promise<IAttachmentFileInfo[]> {
    for (const file of files) {
      const filePath = `${folderUrl}/${file.name}`;
      const exists = await this.checkFileExists(filePath);

      if (exists) {
        file.isFileExists = true;
        file.name = this.generateUniqueFileName(file.name);
      } else {
        file.isFileExists = false;
      }
    }

    const stillConflicting = files.filter(f => f.isFileExists);
    return stillConflicting.length > 0
      ? await this.resolveNameConflicts(files, folderUrl)
      : files;
  }

  private async checkFileExists(fileUrl: string): Promise<boolean> {
    try {
      const file = await sp.web.getFileByServerRelativeUrl(fileUrl).select("Exists")();
      return file.Exists;
    } catch (error) {
      console.warn("Error checking file existence:", fileUrl, error);
      return false;
    }
  }



  public generateUniqueFileName(originalName: string): string {
    const parts = originalName.split(".");
    const ext = parts.pop();
    const baseName = parts.join(".").split("-")[0];
    const [g1, g2] = this.uuidv4().split("-");
    return `${baseName}-${g1}-${g2}.${ext}`;
  }

  private uuidv4(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getCurrentYearMonth(): { year: number; month: string } {
    const currentDt = new Date();
    return {
      year: currentDt.getFullYear(),
      month: currentDt.toLocaleString("en-US", { month: "short" })
    };
  }

  public async detectConflicts( files: IAttachmentFileInfo[], libraryURL: string ): Promise<IAttachmentFileInfo[]> {
    const { year, month } = this.getCurrentYearMonth();
    const folderUrl = `${libraryURL}/${year}/${month}`;
    const conflictingFiles: IAttachmentFileInfo[] = [];

    for (const file of files) {
      const filePath = `${folderUrl}/${file.name}`;
      try {
        const fileInfo = await sp.web.getFileByServerRelativeUrl(filePath).select("Exists")();
        file.isFileExists = fileInfo.Exists;
        if (file.isFileExists) {
          conflictingFiles.push(file);
        }
      } catch (error) {
        console.warn("Error checking file existence:", filePath, error);
        file.isFileExists = false;
      }
    }
    return conflictingFiles;
  }
}