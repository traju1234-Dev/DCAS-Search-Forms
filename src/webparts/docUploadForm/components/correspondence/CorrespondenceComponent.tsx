import * as React from "react";
import { sp } from "@pnp/sp";
import { IGeneralDocsProps } from "../IGeneralDocsProps";

export interface ICorrespondenceComponentState {
    isDisabled: boolean;
    BBL: string;
    Boro: string;
    Block: string;
    Lot: string;    
    REMSAddress: string;

    Agency: string;
    ApplicantName: string;   
    BuildingName:string;
    CommunityDist: number;  
    ElectedOff : string;
    REMSProcess: string;

    LineOfService:string;
    ProjectName: string;
    REMSAuthor:string;
    REMSModule:string;
    REMSSubject: string;
    SubUnit:string;
    TenantName: string;
    Unit:string;

    isBBLEmpty: boolean;
    isBoroEmpty: boolean;
    isBlockEmpty: boolean;  
    isLotEmpty: boolean;    
 
    isLoading: boolean;  
}

export interface ICorrespondenceComponentData extends ICorrespondenceComponentState {
    isValid: boolean;
    metadata?: Record<string, any>;
}

export default class CorrespondenceComponent extends React.Component<IGeneralDocsProps, ICorrespondenceComponentState> {  
   
    constructor(props: IGeneralDocsProps) {        
        super(props);
        //set up spsite URL
        sp.setup({ sp: { baseUrl: this.props.siteAbsoluteURL } });
        this.state = {
            isDisabled: false,
            BBL: "",
            Boro: "",
            Block: "",
            Lot: "",          
            REMSAddress: "",
            
            Agency: "",
            ApplicantName: "",
            BuildingName:"",
            CommunityDist: 0, 
            ElectedOff : "",
            REMSProcess: "",

            LineOfService:"",
            ProjectName: "",
            REMSAuthor:"",
            REMSModule:"",
            REMSSubject: "",
            SubUnit:"",
            TenantName: "",
            Unit:"",

            isBBLEmpty: false,
            isBoroEmpty: false,
            isBlockEmpty: false,
            isLotEmpty: false,
            isLoading: false
        };
    }
    
    public async componentDidMount(): Promise<void> {             
        const { reqID, mode, libName } = this.props;
        if (reqID && (mode === "edit" || mode === "view")) {
            this.setState({ isLoading: true, isDisabled: mode === "view" });
            await this.fetchAppraisalData(reqID, libName);          
        } else {
            //Create Mode
            this.setState({ isDisabled: false });           
        }
        ($('.infoCircle-bottom') as any).tooltip({
            placement: 'bottom',
            trigger: "hover"
        });
    }

    public componentWillUnmount(): void {
        ($('.infoCircle-bottom') as any).tooltip("dispose");
    }   

    public componentDidUpdate(prevProps: IGeneralDocsProps,  prevState: ICorrespondenceComponentState): void {        
        if (this.props.isSubmitTriggered && !prevProps.isSubmitTriggered) {
            this.validateAndSendData();
        }
    }

    private async fetchAppraisalData(reqID: number, libraryName: string): Promise<void> {
        this.setState({ isLoading: true });
        sp.setup({ sp: { baseUrl: this.props.siteAbsoluteURL } });
        try {
            const item = await sp.web.lists
                .getByTitle(libraryName)
                .items.getById(reqID)
                .select("*", "FileLeafRef", "FileRef", "FileDirRef", "EncodedAbsUrl")
                .get();

            if (item?.ID > 0) {
                this.setState({                   
                    BBL: item.BBL || "",
                    Boro: item.Boro || "",
                    Block: item.Block || "",
                    Lot: item.Lot,
                    REMSAddress: item.REMS_Address, 

                    Agency: item.Agency,
                    ApplicantName: item.Applicant_Name,
                    BuildingName: item.Building_Name,
                    CommunityDist: item.Community_District, 
                    ElectedOff : item.Elected_Official,

                    REMSProcess: item.Linked_to_REMS_Process,
                    LineOfService: item.LOS,
                    ProjectName: item.Project_Name,
                    REMSAuthor:item.REMS_Author,
                    REMSModule: item.REMS_Module,

                    REMSSubject: item.REMS_Subject,
                    SubUnit: item.SubUnit,
                    TenantName: item.Tenant_Name,
                    Unit: item.Unit,
                              
                    isLoading: false
                });
            } else {
                console.warn(`No item found with ID: ${reqID}`);
                this.setState({ isLoading: false });
            }
        } catch (e: any) {
            console.error("fetchAppraisalData error:", e);
            this.setState({ isLoading: false });
        }
    }

    private changeTextValue = (updatedVal: string, field: keyof ICorrespondenceComponentState): void => {
        this.setState(prevState => ({
            ...prevState,
            [field]: updatedVal
        }), () => {
            this.validateAndSendData();
        });
    }
    
    private validateAndSendData = (): void => {
        const requiredFields: (keyof ICorrespondenceComponentState)[] = [ "BBL", "Boro", "Block", "Lot" ];
        const emptyFlags: Partial<ICorrespondenceComponentState> = {};
        let isValid = true;

        requiredFields.forEach(field => {
            const value = this.state[field];
            const isEmpty = typeof value === "string" ? value.trim() === "" || value === "--Select--" : value === null || value === undefined;
            const flagKey = `is${field}Empty` as keyof ICorrespondenceComponentState;
            (emptyFlags as any)[flagKey] = isEmpty;
            if (isEmpty) isValid = false;
        });

        this.setState(emptyFlags as Pick<ICorrespondenceComponentState, keyof typeof emptyFlags>);
        const metadata = this.buildMetadataForSharePoint();
        console.log("Metadata being sent:", metadata);
        if (this.props.onFormDataChange) {
            this.props.onFormDataChange(metadata, isValid);
        }
    }   

    private buildMetadataForSharePoint = (): Record<string, any> => {
        const fieldMapping: Record<string, keyof ICorrespondenceComponentState> = {
            BBL: "BBL",
            Boro: "Boro",
            Block: "Block",
            Lot: "Lot",
            REMS_Address: "REMSAddress",
            Agency: "Agency",
            Applicant_Name : "ApplicantName",
            Building_Name: "BuildingName",
            Community_District :"CommunityDist",
            Elected_Official: "ElectedOff",
            Linked_to_REMS_Process : "REMSProcess",
            LOS : "LineOfService",
            Project_Name: "ProjectName",
            REMS_Author: "REMSAuthor",
            REMS_Module: "REMSModule",
            REMS_Subject: "REMSAddress",
            SubUnit: "SubUnit",
            Tenant_Name: "TenantName",
            Unit: "Unit"          
        };
        const metadata: Record<string, any> = {};
        Object.entries(fieldMapping).forEach(([spField, stateKey]) => {
            const value = this.state[stateKey];
            if (value !== undefined && value !== null) {
                metadata[spField] = value;
            }
        });
        return metadata;
    }

    public render(): React.ReactElement<IGeneralDocsProps> {
        const { isDisabled, isLoading } = this.state;
        if (isLoading) {
            return <div>Loading...</div>;
        }

        return (
            <div>                
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">BBL<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter BBL"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BBL")} value={this.state.BBL} id="txBBL" placeholder='Enter BBL' />
                        <span className={this.state.isBBLEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Boro<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Boro"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Boro")} value={this.state.Boro} id="txtBoro" placeholder='Enter Boro' />
                        <span className={this.state.isBoroEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Block<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Block"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Block")} value={this.state.Block} id="txtBlock" placeholder='Enter Block' />
                        <span className={this.state.isBlockEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Lot<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Lot"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Lot")} value={this.state.Lot} id="txtLot" placeholder='Enter Lot' />
                        <span className={this.state.isLotEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>                    
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Address(REMS)<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Address (REMS)"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSAddress")} value={this.state.REMSAddress} id="txtREMSAddress" placeholder='Enter address (REMS)' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Agency<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Agency Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Agency")} value={this.state.Agency} id="txtAgency" placeholder='Enter agency details' />
                    </div>
                </div>
                <div className="form-group row">
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Applicant Name <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Applicant Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ApplicantName")} value={this.state.ApplicantName} id="txtApplicantName" placeholder='Enter Applicant Name' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Building Name <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Building Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BuildingName")} value={this.state.BuildingName} id="txtBuildingName" placeholder='Enter Building Name' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <label className="lblContent">Community District <span className="mandatory">*</span> <span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Community District Number"> <i className="fa fa-info-circle infoIcon"/> </span> </label>
                        <input type="number" className="form-control" disabled={isDisabled} value={this.state.CommunityDist} id="txtCommunityDist" placeholder="Enter Community District Number" min={1} step={1} onChange={(e) => { const value = e.target.value; this.changeTextValue(value, "CommunityDist"); }} />
                    </div>
                </div>
                <div className="form-group row">                   
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Elected Official <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Elected Official Information"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ElectedOff")} value={this.state.ElectedOff} id="txtElectedOff" placeholder='Enter Elected Official Information' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Linked to REMS Process<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSProcess")} value={this.state.REMSProcess} id="txtREMSProcess" placeholder='Enter Linked to REMS Process' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Line of Service<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Line Of Service Information"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "LineOfService")} value={this.state.LineOfService} id="txtPASNo" placeholder='Enter Line Of Service Info here' />
                    </div>
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Project Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Project Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ProjectName")} value={this.state.ProjectName} id="txtULURPNo" placeholder='Enter Project Name' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Author(REMS)<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter REMS Author"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSAuthor")} value={this.state.REMSAuthor} id="txtREMSAuthor" placeholder='Enter REMS Author' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <label className="lblContent">REMS Module<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Select REMS Module"><i className="fa fa-info-circle infoIcon"></i></span></label>
                        <select className="form-select prDropdown" value={this.state.REMSModule} onChange={(e) => this.changeTextValue(e.target.value, "REMSModule")} id="ddlREMSModule" >
                            <option>--Select--</option>                                       
                            <option>Lease</option>
                            <option>Others</option>                                      
                        </select>
                    </div>        
                </div>               
                <div className="form-group row">                  
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Subject(REMS)<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Subject(REMS)"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSSubject")} value={this.state.REMSSubject} id="txtREMSSubject" placeholder='Enter Subject(REMS)' />
                    </div> 
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Sub-Unit<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Sub Unit Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "SubUnit")} value={this.state.SubUnit} id="txtSubUnit" placeholder='Enter Sub Unit' />
                    </div>
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Tenant Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Tenant Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "TenantName")} value={this.state.TenantName} id="txtTenantName" placeholder='Enter Tenant Name' />
                    </div> 
                </div>
                <div className="form-group row">                  
                    <div className="col-md-12 col-lg-12 col-xs-12">
                        <span className="lblContent">Unit<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Unit Number"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Unit")} value={this.state.Unit} id="txtUnit" placeholder='Enter Unit Number' />
                    </div>
                </div>                           
            </div>
        );
    }
}