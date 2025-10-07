import { WebPartContext } from "@microsoft/sp-webpart-base";
import { ICurrentLoginInfo } from "../../../common/modal/ICurrentLoginInfo";
import { IDocumentCategory } from "../../../common/modal/IDocumentCategory";

export interface IDocUploadFormProps {
  context: WebPartContext;
  currentLoginInfo: ICurrentLoginInfo;
  docUploadSiteURL: string;
  viewType: string;
  reqID: number;
  libName: string;
  docCategories: IDocumentCategory[]; 
}
