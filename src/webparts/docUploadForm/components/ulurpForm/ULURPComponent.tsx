import * as React from "react";
import { sp } from "@pnp/sp";
import { IGeneralDocsProps } from "../IGeneralDocsProps";
import DataService from "../../../../common/service/DataService";

export interface IULURPComponentState {
    isDisabled: boolean;
    BBL: string;
    Boro: string;
    Block: string;
    Lot: string;    
    REMSAddress: string;
    AgencyApplicant: string;   
    BIN: string;
    CEQRNumber: string;
    CommunityDist: number;    
    FixedAssetNo: string;
    REMSProcess: string;
    ResCalNo: number;
    ResCalDt:string;
    PASNo: string;
    ProcessModule: string;    
    ULURPNo:string;
    ULURPSuffix: string;
    WRPNo: string;    
    isBBLEmpty: boolean;
    isBoroEmpty: boolean;
    isBlockEmpty: boolean;  
    isLotEmpty: boolean;    
    isProcessModuleEmpty: boolean;
    isULURPNoEmpty: boolean;
    isULURPSuffixEmpty: boolean;
    isLoading: boolean;  
}

export interface IULURPComponentData extends IULURPComponentState {
    isValid: boolean;
    metadata?: Record<string, any>;
}

export default class ULURPComponent extends React.Component<IGeneralDocsProps, IULURPComponentState> {   
    private dataService: DataService; 
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
            AgencyApplicant: "",
            BIN: "",
            CEQRNumber: "",
            CommunityDist: 0,
            FixedAssetNo: "",
            REMSProcess: "",
            ResCalNo: 0,
            ResCalDt:"",
            PASNo: "",
            ProcessModule: "",
            ULURPNo:"",
            ULURPSuffix: "",
            WRPNo: "",          
            isBBLEmpty: false,
            isBoroEmpty: false,
            isBlockEmpty: false,
            isLotEmpty: false,          
            isProcessModuleEmpty: false,
            isULURPNoEmpty:false,
            isULURPSuffixEmpty: false,      
            isLoading: false
        };
    }
    
    public async componentDidMount(): Promise<void> {
        this.dataService = new DataService(this.context, this.props.context.pageContext.web.absoluteUrl);        
        const { reqID, mode, libName } = this.props;
        if (reqID && (mode === "edit" || mode === "view")) {
            this.setState({ isLoading: true, isDisabled: mode === "view" });
            await this.fetchAppraisalData(reqID, libName);
            this.bindDates();
        } else {
            //Create Mode
            this.setState({ isDisabled: false });
            this.bindDates(); 
        }
        ($('.infoCircle-bottom') as any).tooltip({
            placement: 'bottom',
            trigger: "hover"
        });
    }

    public componentWillUnmount(): void {
        ($('.infoCircle-bottom') as any).tooltip("dispose");
    }
   
    private bindDates(): void {
        const dateFields: { id: string; key: keyof IULURPComponentState }[] = [
            { id: 'DTResCal', key: 'ResCalDt' },           
        ];
        dateFields.forEach(({ id, key }) => this.initializeDatePicker(id, key));
    }   
    
    private initializeDatePicker<T extends keyof IULURPComponentState>(elementId: string, stateKey: T): void {
        const selector = `#${elementId}`;
        if ($(selector).length === 0) {
            console.warn(`Element not found: ${selector}`);
            return;
        }

        ($(selector) as any).datepicker({
            format: 'mm/dd/yyyy',
            autoclose: true,
            todayHighlight: true,
            startDate: new Date()
        }).on('changeDate', () => {          
            const selectedDate = ($(selector) as any).datepicker('getDate');
            const formattedDate = this.dataService.getFormattedDate(selectedDate, false);         
            this.changeTextValue(formattedDate, stateKey);
        });        
        // Update the datepicker with current state value
        const currentValue = this.state[stateKey];
        if (currentValue) {
            ($(selector) as any).datepicker('update', currentValue);
        }
    }

    public componentDidUpdate(prevProps: IGeneralDocsProps,  prevState: IULURPComponentState): void {        
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
                const updatedDates = {
                    ResCalDt: this.dataService.getFormattedDate(item.Resolution_CPC_CC_BOE_Date, false),                  
                };

                this.setState({
                    ...updatedDates,
                    BBL: item.BBL || "",
                    Boro: item.Boro || "",
                    Block: item.Block || "",
                    Lot: item.Lot,
                    REMSAddress: item.REMS_Address,
                    AgencyApplicant: item.Agency_Applicant,                  
                    BIN: item.BIN,
                    CEQRNumber: item.CEQR_Number,
                    CommunityDist: item.Community_District,
                    FixedAssetNo: item.Fixed_Asset_Number,                  
                    REMSProcess: item.Linked_to_REMS_Process,
                    PASNo: item.PAS_Number,
                    ProcessModule : item.Process_Module,
                    ResCalNo : item.Resolution_CPC_CC_BOE_Calendar_Number,                   
                    ULURPNo: item.ULURP_Number,
                    ULURPSuffix: item.ULURP_Suffix,
                    WRPNo: item.WRP_Number,                
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

    private changeTextValue = (updatedVal: string, field: keyof IULURPComponentState): void => {
        this.setState(prevState => ({
            ...prevState,
            [field]: updatedVal
        }), () => {
            this.validateAndSendData();
        });
    }
    
    private validateAndSendData = (): void => {
        const requiredFields: (keyof IULURPComponentState)[] = [
            "BBL", "Boro", "Block", "Lot", "ProcessModule" , "ULURPNo", "ULURPSuffix"
        ];

        const emptyFlags: Partial<IULURPComponentState> = {};
        let isValid = true;

        requiredFields.forEach(field => {
            const value = this.state[field];
            const isEmpty = typeof value === "string" ? value.trim() === "" || value === "--Select--" : value === null || value === undefined;
            const flagKey = `is${field}Empty` as keyof IULURPComponentState;
            (emptyFlags as any)[flagKey] = isEmpty;
            if (isEmpty) isValid = false;
        });

        this.setState(emptyFlags as Pick<IULURPComponentState, keyof typeof emptyFlags>);
        const metadata = this.buildMetadataForSharePoint();
        console.log("Metadata being sent:", metadata);
        if (this.props.onFormDataChange) {
            this.props.onFormDataChange(metadata, isValid);
        }
    }   

    private buildMetadataForSharePoint = (): Record<string, any> => {
        const fieldMapping: Record<string, keyof IULURPComponentState> = {
            BBL: "BBL",
            Boro: "Boro",
            Block: "Block",
            Lot: "Lot",
            REMS_Address: "REMSAddress",
            Agency_Applicant: "AgencyApplicant",            
            BIN:"BIN",

            CEQR_Number:"CEQRNumber",
            Community_District: "CommunityDist",
            Fixed_Asset_Number:"FixedAssetNo",
            Linked_to_REMS_Process: "REMSProcess",
            PAS_Number:"PASNo",
            Process_Module: "ProcessModule",
            Resolution_CPC_CC_BOE_Calendar_Number : "ResCalNo",
            Resolution_CPC_CC_BOE_Date: "ResCalDt",
            ULURP_Number: "ULURPNo",
            ULURP_Suffix: "ULURPSuffix",
            WRP_Number: "WRPNo"
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
                        <span className="lblContent">Agency Applicant<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Agency Applicant Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "AgencyApplicant")} value={this.state.AgencyApplicant} id="txtAgencyApplicant" placeholder='Enter agency applicant details' />
                    </div>
                </div>
                <div className="form-group row">
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">BIN <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter BIN Information"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BIN")} value={this.state.BIN} id="txtBIN" placeholder='Enter BIN' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">CEQR Number <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter CEQR Number"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "CEQRNumber")} value={this.state.CEQRNumber} id="txtBuyer" placeholder='Enter CEQR Number' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <label className="lblContent">Community District <span className="mandatory">*</span> <span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Community District Number"> <i className="fa fa-info-circle infoIcon"/> </span> </label>
                        <input type="number" className="form-control" disabled={isDisabled} value={this.state.CommunityDist} id="txtCommunityDist" placeholder="Enter Community District Number" min={1} step={1} onChange={(e) => { const value = e.target.value; this.changeTextValue(value, "CommunityDist"); }} />
                    </div>
                </div>
                <div className="form-group row">                   
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Fixed Asset Number <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "FixedAssetNo")} value={this.state.FixedAssetNo} id="txtFixedAssetNo" placeholder='Enter Fixed Asset Number' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Linked to REMS Process<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSProcess")} value={this.state.REMSProcess} id="txtREMSProcess" placeholder='Enter Linked to REMS Process' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">PAS Number <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter PAS Number"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "PASNo")} value={this.state.PASNo} id="txtPASNo" placeholder='Enter PAS number' />
                    </div>
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <label className="lblContent">Process Module<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Select Process Module"><i className="fa fa-info-circle infoIcon"></i></span></label>
                        <select className="form-select prDropdown" value={this.state.ProcessModule} onChange={(e) => this.changeTextValue(e.target.value, "ProcessModule")} id="ddlProcessModule" >
                            <option>--Select--</option>                                       
                            <option>Lease</option>
                            <option>Others</option>                                      
                        </select>
                        <span className={this.state.isProcessModuleEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>                                            
                    </div>               
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <label className="lblContent">Resolution (CPC or CC or BOE) Calendar Number <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Resolution (CPC or CC or BOE) Calendar Number"> <i className="fa fa-info-circle infoIcon"/> </span> </label>
                        <input type="number" className="form-control" disabled={isDisabled} value={this.state.ResCalNo} id="txtResCalNo" min={1} step={1} onChange={(e) => { const value = e.target.value; this.changeTextValue(value, "ResCalNo"); }} />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Resolution (CPC or CC or BOE) Date<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Resolution (CPC or CC or BOE) Date"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <div id="DTResCal" className="input-group date form-control scDatepicker" data-date-format="mm/dd/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.ResCalDt} onChange={(e) => this.changeTextValue(e.target.value, "ResCalDt")} disabled={isDisabled} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"/>
                            </span>
                        </div>                   
                    </div>                
                </div>               
                <div className="form-group row">                  
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">ULURP Number<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter ULURP Number"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ULURPNo")} value={this.state.ULURPNo} id="txtULURPNo" placeholder='Enter ULURP Number' />
                         <span className={this.state.isULURPNoEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div> 
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">ULURP Suffix<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter ULURP Suffix Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ULURPSuffix")} value={this.state.ULURPSuffix} id="txtULURPSuffix" placeholder='Enter ULURP Suffix' />
                         <span className={this.state.isULURPSuffixEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">WRP Number<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter WRP Number"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "WRPNo")} value={this.state.WRPNo} id="txtWRPNo" placeholder='Enter WRP Number' />
                    </div> 
                </div>                      
            </div>
        );
    }
}