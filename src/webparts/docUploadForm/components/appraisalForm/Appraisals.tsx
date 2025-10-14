import * as React from "react";
import { sp } from "@pnp/sp";
import { IGeneralDocsProps } from "../IGeneralDocsProps";
import DataService from "../../../../common/service/DataService";

export interface IAppraisalsState {
    isDisabled: boolean;
    BBL: string;
    Boro: string;
    Block: string;
    Lot: string;    
    REMSAddress: string;
    ApplicantName: string;
    AppraisalDt: string;
    AppraisalReason: string;
    AppraiserName: string;
    BIN: string;
    Buyer: string;
    CommunityDist: number;
    FixedAssetNo: string;
    Floor: string;
    REMSProcess: string;
    Occupant: string;
    ProjName: string;
    PropertyName: string;
    ReviewAppraiser: string;
    ReviewAppraiserDt: string;
    SecondAppraisalDt: string;
    SecondAppraiser: string;
    Seller: string;
    TenantName: string;
    isBBLEmpty: boolean;
    isBoroEmpty: boolean;
    isBlockEmpty: boolean;  
    isLotEmpty: boolean;    
    isREMSAddressEmpty: boolean;
    isAppraisalReasonEmpty: boolean;
    isLoading: boolean;  
}

export interface IAppraisalFormData extends IAppraisalsState {
    isValid: boolean;
    metadata?: Record<string, any>;
}

export default class Appraisals extends React.Component<IGeneralDocsProps, IAppraisalsState> {   
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
            ApplicantName: "",            
            AppraisalDt: "",
            AppraisalReason: "",
            AppraiserName: "",
            BIN: "",
            Buyer: "",
            CommunityDist: 0,
            FixedAssetNo: "",
            Floor: "",
            REMSProcess: "",
            Occupant: "",
            ProjName: "", 
            PropertyName: "",
            ReviewAppraiser: "",
            ReviewAppraiserDt: "",
            SecondAppraisalDt: "",
            SecondAppraiser: "",
            Seller: "",
            TenantName: "",
            isBBLEmpty: false,
            isBoroEmpty: false,
            isBlockEmpty: false,
            isLotEmpty: false,          
            isREMSAddressEmpty: false,
            isAppraisalReasonEmpty:false,
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
        const dateFields: { id: string; key: keyof IAppraisalsState }[] = [
            { id: 'DTAppraisal', key: 'AppraisalDt' },
            { id: 'DTReviewAppraiser', key: 'ReviewAppraiserDt' },
            { id: 'DTSecondAppraisal', key: 'SecondAppraisalDt' }
        ];
        dateFields.forEach(({ id, key }) => this.initializeDatePicker(id, key));
    }   
    
    private initializeDatePicker<T extends keyof IAppraisalsState>(elementId: string, stateKey: T): void {
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

    public componentDidUpdate(prevProps: IGeneralDocsProps,  prevState: IAppraisalsState): void {
        // if (this.state.AppraisalDt !== prevState.AppraisalDt) {
        //     ($('#DTAppraisal') as any).datepicker('update', this.state.AppraisalDt);
        // }
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
                    AppraisalDt: this.dataService.getFormattedDate(item.Appraisal_Date, false),
                    ReviewAppraiserDt: this.dataService.getFormattedDate(item.Review_Appraiser_Date, false),
                    SecondAppraisalDt: this.dataService.getFormattedDate(item.Second_Appraisal_Date, false)
                };

                this.setState({
                    ...updatedDates,
                    BBL: item.BBL || "",
                    Boro: item.Boro || "",
                    Block: item.Block || "",
                    Lot: item.Lot,
                    REMSAddress: item.REMS_Address,
                    ApplicantName: item.Applicant_Name,
                    AppraisalReason: item.Appraisal_Reason,
                    AppraiserName: item.Appraiser_Name,
                    BIN: item.BIN,
                    Buyer: item.Buyer,
                    CommunityDist: item.Community_District,
                    FixedAssetNo: item.Fixed_Asset_Number,
                    Floor: item.Floor,
                    REMSProcess: item.Linked_to_REMS_Process,
                    Occupant: item.Occupant_Squatter,
                    ProjName: item.Project_Name,
                    PropertyName: item.Property_Name,
                    ReviewAppraiser: item.Review_Appraiser,
                    SecondAppraiser: item.Second_Appraiser,
                    Seller: item.Seller,
                    TenantName: item.Tenant_Name,
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

    private changeTextValue = (updatedVal: string, field: keyof IAppraisalsState): void => {
        this.setState(prevState => ({
            ...prevState,
            [field]: updatedVal
        }), () => {
            this.validateAndSendData();
        });
    }
    
    private validateAndSendData = (): void => {
        const requiredFields: (keyof IAppraisalsState)[] = [
            "BBL", "Boro", "Block", "Lot", "REMSAddress", "AppraisalReason"
        ];

        const emptyFlags: Partial<IAppraisalsState> = {};
        let isValid = true;

        requiredFields.forEach(field => {
            const value = this.state[field];
            const isEmpty = typeof value === "string" ? value.trim() === "" : value === null || value === undefined;
            const flagKey = `is${field}Empty` as keyof IAppraisalsState;
            (emptyFlags as any)[flagKey] = isEmpty;
            if (isEmpty) isValid = false;
        });

        this.setState(emptyFlags as Pick<IAppraisalsState, keyof typeof emptyFlags>);
        const metadata = this.buildMetadataForSharePoint();
        console.log("Metadata being sent:", metadata);
        if (this.props.onFormDataChange) {
            this.props.onFormDataChange(metadata, isValid);
        }
    }   

    private buildMetadataForSharePoint = (): Record<string, any> => {
        const fieldMapping: Record<string, keyof IAppraisalsState> = {
            BBL: "BBL",
            Boro: "Boro",
            Block: "Block",
            Lot: "Lot",
            REMS_Address: "REMSAddress",
            Applicant_Name: "ApplicantName",
            Appraisal_Date: "AppraisalDt",
            Appraisal_Reason: "AppraisalReason",
            Appraiser_Name: "AppraiserName",
            BIN: "BIN",
            Buyer: "Buyer",
            Community_District: "CommunityDist",
            Fixed_Asset_Number: "FixedAssetNo",
            Floor: "Floor",
            Linked_to_REMS_Process: "REMSProcess",
            Occupant_Squatter: "Occupant",
            Project_Name: "ProjName",
            Property_Name: "PropertyName",
            Review_Appraiser: "ReviewAppraiser",
            Review_Appraiser_Date: "ReviewAppraiserDt",
            Second_Appraisal_Date: "SecondAppraisalDt",
            Second_Appraiser: "SecondAppraiser",
            Seller: "Seller",
            Tenant_Name: "TenantName"
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
                        <span className="lblContent">Address(REMS)<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Address (REMS)"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSAddress")} value={this.state.REMSAddress} id="txtREMSAddress" placeholder='Enter address (REMS)' />
                        <span className={this.state.isREMSAddressEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Applicant Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Applicant Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ApplicantName")} value={this.state.ApplicantName} id="txtApplicantName" placeholder='Enter applicant name' />
                    </div>
                </div>
                <div className="form-group row">                  
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Appraisal Date <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraisal Date"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <div id="DTAppraisal" className="input-group date form-control scDatepicker" data-date-format="mm/dd/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.AppraisalDt} onChange={(e) => this.changeTextValue(e.target.value, "AppraisalDt")} disabled={isDisabled} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"/>
                            </span>
                        </div>                   
                    </div>            
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Appraisal Reason<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraisal Reason"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "AppraisalReason")} value={this.state.AppraisalReason} id="txtAppraiserReason" placeholder='Enter appraisal reason' />
                        <span className={this.state.isAppraisalReasonEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>                    
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Appraiser Name <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "AppraiserName")} value={this.state.AppraiserName} id="txtAppraiserName" placeholder='Enter appraiser name' />
                    </div>
                </div>
                <div className="form-group row">                    
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">BIN <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter BIN Information"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BIN")} value={this.state.BIN} id="txtBIN" placeholder='Enter BIN' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Buyer <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Buyer Information"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Buyer")} value={this.state.Buyer} id="txtBuyer" placeholder='Enter buyer' />
                    </div>
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <label className="lblContent"> Community District <span className="mandatory">*</span> <span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Community District Number"> <i className="fa fa-info-circle infoIcon"/> </span> </label>
                        <input type="number" className="form-control" disabled={isDisabled} value={this.state.CommunityDist} id="txtCommunityDist" placeholder="Enter Community District Number" min={1} step={1} onChange={(e) => { const value = e.target.value; this.changeTextValue(value, "CommunityDist"); }} />
                    </div>
                </div>
                <div className="form-group row">                   
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Fixed Asset Number <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "FixedAssetNo")} value={this.state.FixedAssetNo} id="txtFixedAssetNo" placeholder='Enter Fixed Asset Number' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Floor <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Floor")} value={this.state.Floor} id="txtFloor" placeholder='Enter Floor Details' />
                    </div>
                      <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Linked to REMS Process<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSProcess")} value={this.state.REMSProcess} id="txtREMSProcess" placeholder='Enter Linked to REMS Process' />
                    </div>
                </div>
                <div className="form-group row">
                  
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Occupant/Squatter<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Occupant")} value={this.state.Occupant} id="txtOccupant" placeholder='Enter Occupant/Squatter' />
                    </div> 
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Project Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Project Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ProjName")} value={this.state.ProjName} id="txtProjName" placeholder='Enter project name' />
                    </div>
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Property Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Property Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "PropertyName")} value={this.state.PropertyName} id="txtPropName" placeholder='Enter property name' />
                    </div> 
                </div>
                <div className="form-group row">                   
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Review Appraiser<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Review Appraiser"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ReviewAppraiser")} value={this.state.ReviewAppraiser} id="txtReviewAppraiser" placeholder='Enter review appraiser here' />
                    </div> 
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Review Appraiser Date<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Review Appraiser Date"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <div id="DTReviewAppraiser" className="input-group date form-control scDatepicker" data-date-format="mm/dd/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.ReviewAppraiserDt} onChange={(e) => this.changeTextValue(e.target.value, "ReviewAppraiserDt")} disabled={isDisabled}/>
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"/>
                            </span>
                        </div>                   
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Second Appraisal Date<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Second Appraisal Date"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <div id="DTSecondAppraisal" className="input-group date form-control scDatepicker" data-date-format="mm/dd/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.SecondAppraisalDt} onChange={(e) => this.changeTextValue(e.target.value, "SecondAppraisalDt")} disabled={isDisabled}/>
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"/>
                            </span>
                        </div>                   
                    </div>
                </div>
                <div className="form-group row">
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Second Appraiser<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Second Appraiser"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "SecondAppraiser")} value={this.state.SecondAppraiser} id="txtSecondAppraiser" placeholder='Enter second appraiser here' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Seller<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Seller Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Seller")} value={this.state.Seller} id="txtSeller" placeholder='Enter seller details here' />
                    </div>
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Tenant Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Tenant Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "TenantName")} value={this.state.TenantName} id="txtTenant" placeholder='Enter tenant details here' />
                    </div> 
                </div>                               
            </div>
        );
    }
}