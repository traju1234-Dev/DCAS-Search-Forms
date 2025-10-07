import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ICurrentLoginInfo } from '../../../../common/modal/ICurrentLoginInfo';
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";
import { IDocumentCategory } from '../../../../common/modal/IDocumentCategory';
import { sp } from '@pnp/sp';

import { Constants } from '../../../../common/constants/Constants';
import FileUploadService, { IAttachmentFileInfo } from "../../../../common/service/FileUploadService";
import Appraisals, { IAppraisalFormData} from '../appraisalForm/Appraisals';


const componentMap: { [key: string]: React.ComponentType<any> } = {
    Appraisals: Appraisals,   
};

export interface DocUploadNewProps {
    context: WebPartContext;
    currentLoginInfo: ICurrentLoginInfo; 
    docUploadSiteURL:string;
    docCategories: IDocumentCategory[];
    viewType:string;
    requestId:number;
    libName: string;
}

export interface DocUploadNewState {
    msgError:string;
    showLoader: boolean;
    selectedDocCategory: string;
    isDocCategoryEmpty: boolean;
    attachmentFilesInfo: IAttachmentFileInfo[];
    isFileNameValid:boolean;
    isSubmitTriggered: boolean;
    siteAbsoluteURL: string;
    submitButtonLabel: string;
    isFormDisable: boolean;
}

export default class DocUploadNew extends React.Component <DocUploadNewProps, DocUploadNewState > {    
    isEmpty: boolean;
    private fileUploadService: FileUploadService | null = null;
    private appraisalFormData: IAppraisalFormData | null = null;
    constructor(props: DocUploadNewProps) {       
        super(props);
        //Write individual methods here
        this.BackToDashboard = this.BackToDashboard.bind(this);
        this.handleDraftClick = this.handleDraftClick.bind(this);
        this.handleSubmitClick = this.handleSubmitClick.bind(this);
        this.handleCancleClick = this.handleCancleClick.bind(this);
        this.CloseModalDialogClick = this.CloseModalDialogClick.bind(this);
       
        this.state = {
            msgError: "",
            showLoader:false,
            selectedDocCategory: this.props.libName ?? '',
            isDocCategoryEmpty: false,
            attachmentFilesInfo: [],
            isFileNameValid: true,
            isSubmitTriggered: false,
            siteAbsoluteURL : this.props.docUploadSiteURL ? this.props.docUploadSiteURL : new URL(this.props.context.pageContext.web.absoluteUrl).origin + "/sites/DCAS-ACRES-Dev-General",
            submitButtonLabel: this.props.viewType.toLowerCase() === "edit" ? "Update" : this.props.viewType === "view" ? "" : "Submit",
            isFormDisable: this.props.viewType.toLowerCase() === "view" ? true: false,
        };
    }
    
    public async componentDidMount() {      
        const selectedDocCategory = this.state.selectedDocCategory;      
        if (this.props.viewType.toLowerCase() === "edit") {
            try {
                sp.setup({ sp: { baseUrl: this.state.siteAbsoluteURL }});
                const listItem: any = await sp.web.lists.getByTitle(selectedDocCategory).items.getById(this.props.requestId).select("ID", "FileLeafRef").get();
                const fileName = listItem.FileLeafRef;
                const existingFiles: IAttachmentFileInfo[] = [{
                    name: fileName,
                    size: 0,
                    content: new ArrayBuffer(0),
                    isFileExists: true
                }];
                this.setState({ attachmentFilesInfo: existingFiles });
                const uploadedQuotesFileHTML = existingFiles.map(file => `
                    <li>
                    <span class='fileName' title='${file.size}'>${file.name}</span>
                    <span class='fileProgressBar'></span>
                    <i title="${file.name}" class='closeIcon RemoveUploadedFiles'></i>
                    </li>
                `).join("");
                $('#divUploadedAttachments ul').html(uploadedQuotesFileHTML);
                $('#GeneralDragDropID').html("<mark>Drag & Drop or </mark><span>Browse</span><mark>your file here</mark>");
                $('#idNomDocUploadExtra1').css('display', 'block');
                $('#divUploadedAttachments').removeClass('d-none');
                this.setupRemoveHandler();
            } catch (error) {
                console.error("Error loading existing files:", error);
            }
        }
    }
    
    private async UploadAttachments(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const fileContent = e.target.result;
            const newFile: IAttachmentFileInfo[] = [{
                name: file.name,
                content: fileContent,
                size: file.size,
                isFileExists: false
            }];
            const uploadedQuotesFileHTML = `
            <li>
                <span class='fileName' title='${file.size}'>${file.name}</span>
                <span class='fileProgressBar'></span>
                <i title="${file.name}" class='closeIcon RemoveUploadedFiles'></i>
            </li>
            `;
            this.setState({ attachmentFilesInfo: newFile });
            $('#divUploadedAttachments ul').html(uploadedQuotesFileHTML);
            $('#GeneralDragDropID').html("<mark>Drag & Drop or </mark><span>Browse</span><mark>your file here</mark>");
            $('#idNomDocUploadExtra1').css('display', 'block');
            $('#divUploadedAttachments').removeClass('d-none');
            this.setupRemoveHandler();
        };
        reader.readAsArrayBuffer(file);
    }

    private setupRemoveHandler(): void {
        $('#divUploadedAttachments').off('click', 'i.RemoveUploadedFiles');
        $('#divUploadedAttachments').on('click', 'i.RemoveUploadedFiles', (e) => {
            const target = $(e.currentTarget);
            const fileNameToRemove = target.attr("title");
            // Remove from UI
            target.closest('li').remove();
            // Remove from state
            const updatedFiles = this.state.attachmentFilesInfo.filter(
                file => file.name !== fileNameToRemove
            );
            this.setState({ attachmentFilesInfo: updatedFiles });
            // Hide section if empty
            if ($('#divUploadedAttachments ul li').length === 0) {
                $('#divUploadedAttachments').addClass('d-none');
            }
        });
    }

    private handleAppraisalFormChange = (data: IAppraisalFormData) => {
        this.appraisalFormData = data;       
    } 

    public async handleSubmitClick(): Promise<void> {
        const relativeUrl = new URL(this.state.siteAbsoluteURL).pathname;
        const folderUrl = `${relativeUrl}/${this.state.selectedDocCategory}`;
        this.setState({ isSubmitTriggered: true }, async () => {
            setTimeout(async () => {
            const { selectedDocCategory, attachmentFilesInfo } = this.state;           
            if (!selectedDocCategory || selectedDocCategory === "--Select--") {
                this.showError("Please select a document category.");
                return;
            }
            if (!attachmentFilesInfo || attachmentFilesInfo.length === 0) {
                this.showError("Please upload at least one file before submitting.");
                return;
            }
            if (["create", "edit"].includes(this.props.viewType.toLowerCase())) {
                if (!this.appraisalFormData?.isValid) {
                this.showError(`Please fill out all required fields in ${this.state.selectedDocCategory} form.`);
                return;
                }
            }
            if (!this.fileUploadService) {
                this.fileUploadService = new FileUploadService(this.state.siteAbsoluteURL, relativeUrl, selectedDocCategory);
            }
            const conflictingFiles = await this.fileUploadService.detectConflicts(attachmentFilesInfo, folderUrl);
            if (conflictingFiles.length > 0) {
                this.handleConflicts(conflictingFiles, attachmentFilesInfo);
                return;
            }
            await this.uploadFiles(attachmentFilesInfo);
            }, 100);
        });
    }
    
    private showError(message: string): void {
        this.setState({ msgError: message });
        ($('#viewErrorPopup') as any).modal('show');
    }

    private async uploadFiles(files: IAttachmentFileInfo[]): Promise<void> {
        this.setState({ showLoader: true });
        try {
            if (!this.fileUploadService) return;
            await this.fileUploadService.uploadFiles(files, this.appraisalFormData ?? undefined);
            this.setState({
                msgError: "Files uploaded successfully!",
                attachmentFilesInfo: []
            });
            
            // Clear the uploaded file list from the DOM
            $('#divUploadedAttachments ul').html('');
            $('#divUploadedAttachments').addClass('d-none');

            // Show success popup
            ($('#viewSuccessPopup') as any).modal('show');
        } catch (error) {
            this.setState({ msgError: "File upload failed." });
            console.error("Upload error:", error);
        } finally {
            this.setState({ showLoader: false });
        }
    }

    private handleConflicts(conflictingFiles: IAttachmentFileInfo[], allFiles: IAttachmentFileInfo[]): void {
        $('#conflictFileName').text(conflictingFiles[0].name);
        ($('#fileConflictModal') as any).modal('show');
        $('#overwriteBtn').off('click').on('click', async () => {
            ($('#fileConflictModal') as any).modal('hide');
            await this.uploadFiles(allFiles);
        });
        $('#keepBothBtn').off('click').on('click', async () => {
            ($('#fileConflictModal') as any).modal('hide');
            const renamedFiles = allFiles.map(file => {
                if (file.isFileExists && this.fileUploadService) {
                    file.name = this.fileUploadService.generateUniqueFileName(file.name);
                }
                return file;
            });
            await this.uploadFiles(renamedFiles);
        });
    }
      
    /** Used to redirect to Dashboard **/
    private async BackToDashboard(): Promise<void> {
      window.location.replace(this.props.context.pageContext.web.absoluteUrl + Constants.Key_DashboardURL);        
    }
    
    /** Handle Cancel Click **/
    private async handleCancleClick(): Promise<void> {
        window.location.replace(this.props.context.pageContext.web.absoluteUrl + Constants.Key_DashboardURL); 
    }
    
    /** Handle Draft Click **/
    private async handleDraftClick(): Promise<void> {
        console.log("Draft Button click");  
    }  
   
    private async CloseModalDialogClick() : Promise<void> {
        ($('#viewErrorPopup') as any).modal('hide');
        ($('#viewSuccessPopup') as any).modal('hide');
        ($('#fileConflictModal') as any).modal('hide');      
        this.setState({ msgError: "" });     
    }

    private changeTextValue = (value: string, field: string): void => {
        if (field === "selDocCategory") {
        this.setState({ selectedDocCategory: value, isDocCategoryEmpty: value.trim() === "" || value === "--Select--"}); }
    }

    render() {
        const { context, currentLoginInfo, viewType, requestId, libName } = this.props;      
        const SelectedComponent = componentMap[this.state.selectedDocCategory] || null;
        return (<div className="container-fluid proxima">
            <div id="DCASUploadForm">
                <div className="form-group row">
                    <div className='col-lg-6 col-md-6'>
                        <div className="form-group row">
                            <div className="col-sm-12">
                                <span className="formHeaderMain">Welcome</span>
                            </div>
                            <div className="col-sm-12">
                                <span className='formHeaderSub'>{currentLoginInfo.Name}</span>
                            </div>
                        </div>
                    </div>
                    <div className='col-lg-6 col-md-6 textalign'>
                        <button className="btn btnPrimaryBlue" onClick={this.BackToDashboard}>Back To Dashboard</button>
                    </div>
                </div>
            </div>
            <div className="accordion card border-light-form form-group" >
                <div className="accordion-item border-0" id="ReqInfoContainer">
                    <h2 className="accordion-header">
                        <button className="accordion-button formHeaderMain " type="button" data-bs-toggle="collapse" data-bs-target="#ReqInfoSection" aria-expanded="false" aria-controls="ReqInfoSection">
                            <i className="fa-solid fa-calendar-days iconpadding"></i> Requester Information
                        </button>
                    </h2>
                    <div id="ReqInfoSection" className="accordion-collapse collapse show" aria-spanledby="ReqInfoContainer">
                        <div className="accordion-body nopadding">                           
                            <div className="form-group row">
                                <div className="col-md-6 col-lg-6 col-xs-12">
                                    <span className="lblContent">Requester Name<span className="manadatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Requester Details"><i className="fa fa-info-circle infoIcon"></i></span></span>
                                    <PeoplePicker
                                        context={{
                                            msGraphClientFactory: context.msGraphClientFactory,
                                            spHttpClient: context.spHttpClient,
                                            absoluteUrl: context.pageContext.web.absoluteUrl
                                        }}                                     
                                        personSelectionLimit={1}
                                        required={false}
                                        disabled={true}                                       
                                        defaultSelectedUsers={[currentLoginInfo.UserEmail ? currentLoginInfo.UserEmail : ""]}                                           
                                        principalTypes={[PrincipalType.User]}
                                        resolveDelay={1000}
                                        ensureUser={true}
                                    />                                                                
                                    <span className={this.isEmpty? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                                </div>
                                 <div className="col-md-6 col-lg-6 col-xs-12">
                                    <span className="lblContent">Document Category<span className="manadatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Select document category "><i className="fa fa-info-circle infoIcon"></i></span></span>
                                    <select className="form-select prDropdown" disabled={this.state.isFormDisable} id="ddlDocCategory" value={this.state.selectedDocCategory} onChange={(e) => this.changeTextValue(e.target.value, "selDocCategory")} >
                                        <option value="">--Select--</option>
                                            {this.props.docCategories.map((category, key) => (
                                                <option key={key} value={category.Title} title={category.Title}>
                                                {category.Title}
                                                </option>
                                            ))}
                                    </select>
                                    <span className={this.state.isDocCategoryEmpty ? "errorMsg" : "errorMsg d-none"}> You can't leave this blank </span>
                                </div>                         
                            </div>                                                 
                        </div>
                    </div>
                </div>
                { SelectedComponent &&
                    <div className="accordion-item border-0" id="DocMetadata">
                        <h2 className="accordion-header" >
                            <button className="accordion-button formHeaderMain" type="button" data-bs-toggle="collapse" data-bs-target="#DocMetadataInfo" aria-expanded="false" aria-controls="DocMetadataInfo">
                                <i className="fa-solid fa-calendar-days iconpadding"></i> {this.state.selectedDocCategory}
                            </button>
                        </h2>
                        <div id="DocMetadataInfo" className="accordion-collapse collapse show" aria-spanledby="DocMetadata">
                            <SelectedComponent 
                                context={context} 
                                mode={viewType}
                                reqID={requestId}
                                libName ={libName}
                                siteAbsoluteURL = {this.state.siteAbsoluteURL}
                                onFormDataChange={this.handleAppraisalFormChange}
                                isSubmitTriggered={this.state.isSubmitTriggered}
                            />
                        </div>                
                    </div>
                }

                <div className="accordion-item border-0" id="AttachmentContainer">
                    <h2 className="accordion-header" >
                        <button className="accordion-button formHeaderMain" type="button" data-bs-toggle="collapse" data-bs-target="#AttachInfoSection" aria-expanded="false" aria-controls="AttachInfoSection">
                            <i className="fa-solid fa-calendar-days iconpadding"></i> Attachments
                        </button>
                    </h2>
                    <div id="AttachInfoSection" className="accordion-collapse collapse show" aria-spanledby="AttachmentContainer">
                        <div className="accordion-body card-body nopadding">
                            <div className="form-group row">                            
                                <div className="col-md-6 col-lg-6 col-xs-12">
                                    <div className="form-group required" id="ResReqFileUpload">
                                        <div className="upload">
                                            <input type="file" id="uploadAttachments" onChange={this.UploadAttachments.bind(this)} />
                                            <p id="GeneralDragDropID" className="dragDropLbl">
                                                <mark>Drag & Drop or </mark>
                                                <span>Browse</span>
                                                <mark>your file here</mark>
                                            </p>
                                        </div>                                   
                                    </div>
                                </div>                                
                                <div className="col-md-6 col-lg-6 col-xs-12">
                                    <div className="fileBrowsedList d-none" id="divUploadedAttachments">
                                        <div className="uploadedHeader">Uploaded files</div>
                                        <ul className="browseFileListItem" id="ULUploadedAttachments">
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group row">
                                <div className="col-md-12 col-lg-12 col-xs-12">
                                    <span className={this.state.isFileNameValid === true? "errorMsg d-none" : "errorMsg" }>The Attachments file name(s) you uploaded contains invalid characters such as ~ &quot; + # % &#38; * : &#60; &#62; ? / \ &#123; &#124; &#125;. Please remove these special characters and upload it again.</span> 
                                </div>
                            </div>
                            <div className="form-group row">
                                <div className="col-md-12 col-lg-12 col-xs-12">
                                    <span className='formHeaderMain'>Note</span>
                                    <ul className='ulst'>
                                        <li><i className="fa fa-dot-circle-o" aria-hidden="true"></i> Maximum upload per file size is :10MB</li>
                                        <li><i className="fa fa-dot-circle-o" aria-hidden="true"></i> Following characters that are not allowed in file name  ~ &quot; + # % &#38; * : &#60; &#62; ? / \ &#123; &#124; &#125;</li>
                                    </ul>
                                </div>
                            </div>
                        </div>                           
                    </div>
                </div>
            </div>
            <div className={`form-group row ${this.state.isFormDisable ? 'd-none' : ''}`}>
                <div className='d-flex align-items-center justify-content-end'>
                    <div className="btn-toolbar" role="toolbar" aria-span="Toolbar with button groups">
                        <div className="btn-group" role="group" aria-span="Third group">
                            <button onClick={this.BackToDashboard} className={`btn btnPrimaryBlue ${this.state.isFormDisable ? 'd-none' : ''}`}>Cancel</button>
                        </div>                        
                        <div className="btn-group" role="group" aria-span="First group">
                            <button onClick={this.handleDraftClick} className={`btn btnPrimaryBlue ${this.state.isFormDisable ? 'd-none' : ''}`}>Save as Draft</button>
                        </div>
                        <div className="btn-group" role="group" aria-span="Second group">
                            <button onClick={this.handleSubmitClick} className={`btn btnPrimaryBlue ${this.state.isFormDisable ? 'd-none' : ''}`}>{this.state.submitButtonLabel}</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal fade" id="viewSuccessPopup" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-sm" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title publishHeader" id="exampleModalLongTitle">Success</h5>
                        </div>
                        <div className="modal-body">
                            <p>General document uploaded successfully.</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btnPrimaryBlue" onClick={this.BackToDashboard}>Go to Dashboard</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal fade" id="viewErrorPopup" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-sm" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title publishHeader" id="exampleModalLongTitle">Warning !!</h5>
                            <a className="close" onClick={this.CloseModalDialogClick} />
                        </div>
                        <div className="modal-body">
                            <div id="errorMessage" role="alert"
                                 dangerouslySetInnerHTML={{__html: this.state.msgError}}>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={this.CloseModalDialogClick} className="btn btnPrimaryBlue">Close</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="fileConflictModal" className="modal fade" role="dialog" aria-hidden="true">
                <div className="modal-dialog modal-sm" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title publishHeader">File Conflict</h5>
                            <a className="close" onClick={this.CloseModalDialogClick} />
                        </div>
                        <div className="modal-body">
                            <p> A file with this name already exists: <span id="conflictFileName" className="itemName"></span>. </p>
                            <p>Would you like to overwrite the existing file or keep both?</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btnPrimaryBlue" id="overwriteBtn">Overwrite</button>
                            <button type="button" className="btn btnPrimaryBlue" id="keepBothBtn">Keep Both</button>
                        </div>
                    </div>
                </div>
            </div>
            {this.state.showLoader && (
                <div className='loadercontainer'>
                    <div className='newloader'>
                        <div className='loader--dot'></div>
                        <div className='loader--dot'></div>
                        <div className='loader--dot'></div>
                        <div className='loader--dot'></div>
                        <div className='loader--dot'></div>
                        <div className='loader--dot'></div>
                        <div className='loader--text'></div>
                    </div>
                </div>
            )}
        </div>
        );
    }
}