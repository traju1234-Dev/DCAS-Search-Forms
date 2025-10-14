import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IAppraisalsProps<T = Record<string, any>> {
    context: WebPartContext;
    mode: string; 
    reqID: number; 
    libName: string;
    siteAbsoluteURL: string;
    onFormDataChange?: (metadata: Record<string, any>, isValid: boolean) => void;
    isSubmitTriggered?: boolean;
}
