import { WebPartContext } from "@microsoft/sp-webpart-base";
import { IAppraisalFormData } from "./Appraisals";

export interface IAppraisalsProps {
    context: WebPartContext;
    mode: string; 
    reqID: number; 
    libName: string;
    siteAbsoluteURL: string;
    onFormDataChange?: (data: IAppraisalFormData) => void;
    isSubmitTriggered?: boolean;

}
