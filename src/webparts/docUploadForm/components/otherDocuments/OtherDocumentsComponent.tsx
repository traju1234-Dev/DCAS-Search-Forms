import * as React from "react";
import { sp } from "@pnp/sp";
import { IGeneralDocsProps } from "../IGeneralDocsProps";
import DataService from "../../../../common/service/DataService";

export interface IOtherDocumentsComponentState {
    isDisabled: boolean;
    BBL: string;
    Boro: string;
    Block: string;
    Lot: string;    
    REMSAddress: string;

    Agency: string;
    BIN: string;   
    BuildingName:string;
    CommunityDist: number; 
    DocName : string; 
    
    Floor: string;
    ProjectName: string;
    Reason: string;
    Audience: string;    
    REMSAuthor:string;
    REMSDate:string;
    Topic:string;

    isBBLEmpty: boolean;
    isBoroEmpty: boolean;
    isBlockEmpty: boolean;  
    isLotEmpty: boolean;    
 
    isLoading: boolean;  
}

export interface IOtherDocumentsComponentData extends IOtherDocumentsComponentState {
    isValid: boolean;
    metadata?: Record<string, any>;
}

export default class OtherDocumentsComponent extends React.Component<IGeneralDocsProps, IOtherDocumentsComponentState> {  
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

            Agency: "",
            BIN: "",
            BuildingName:"",
            CommunityDist: 0, 
            DocName: "",
           
            Floor: "",
            ProjectName:"",
            Reason: "",
            Audience:"",
            REMSAuthor:"",
            REMSDate:"",
            Topic:"",

            isBBLEmpty: false,
            isBoroEmpty: false,
            isBlockEmpty: false,
            isLotEmpty: false,
            isLoading: false
        };
    }
    
    public async componentDidMount(): Promise<void> { 
        this.dataService = new DataService(this.context,this.props.context.pageContext.web.absoluteUrl);               
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
        const dateFields: { id: string; key: keyof IOtherDocumentsComponentState }[] = [ { id: 'DTREMS', key: 'REMSDate' } ];
        dateFields.forEach(({ id, key }) => this.initializeDatePicker(id, key));
    }   
    
    private initializeDatePicker<T extends keyof IOtherDocumentsComponentState>(elementId: string, stateKey: T): void {
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

    public componentDidUpdate(prevProps: IGeneralDocsProps,  prevState: IOtherDocumentsComponentState): void {        
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
                    REMSDate: this.dataService.getFormattedDate(item.REMS_Date, false)             
                };
                this.setState({
                      ...updatedDates,                   
                    BBL: item.BBL || "",
                    Boro: item.Boro || "",
                    Block: item.Block || "",
                    Lot: item.Lot,
                    REMSAddress: item.REMS_Address,
                    Agency: item.Agency,
                    BIN: item.BIN,
                    BuildingName: item.Building_Name,
                    CommunityDist: item.Community_District,
                    DocName: item.Document_Name,
                    Floor : item.Floor,
                    ProjectName: item.Project_Name,
                    Reason: item.Reason,
                    Audience: item.REMS_Audience,
                    REMSAuthor: item.REMS_Author,                   
                    Topic: item.Topic,                                                 
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

    private changeTextValue = (updatedVal: string, field: keyof IOtherDocumentsComponentState): void => {
        this.setState(prevState => ({
            ...prevState,
            [field]: updatedVal
        }), () => {
            this.validateAndSendData();
        });
    }
    
    private validateAndSendData = (): void => {
        const requiredFields: (keyof IOtherDocumentsComponentState)[] = [ "BBL", "Boro", "Block", "Lot" ];
        const emptyFlags: Partial<IOtherDocumentsComponentState> = {};
        let isValid = true;

        requiredFields.forEach(field => {
            const value = this.state[field];
            const isEmpty = typeof value === "string" ? value.trim() === "" || value === "--Select--" : value === null || value === undefined;
            const flagKey = `is${field}Empty` as keyof IOtherDocumentsComponentState;
            (emptyFlags as any)[flagKey] = isEmpty;
            if (isEmpty) isValid = false;
        });

        this.setState(emptyFlags as Pick<IOtherDocumentsComponentState, keyof typeof emptyFlags>);
        const metadata = this.buildMetadataForSharePoint();
        console.log("Metadata being sent:", metadata);
        if (this.props.onFormDataChange) {
            this.props.onFormDataChange(metadata, isValid);
        }
    }   

    private buildMetadataForSharePoint = (): Record<string, any> => {
        const fieldMapping: Record<string, keyof IOtherDocumentsComponentState> = {
            BBL: "BBL",
            Boro: "Boro",
            Block: "Block",
            Lot: "Lot",
            REMS_Address: "REMSAddress",
            Agency: "Agency",            
            BIN: "BIN",
            Building_Name: "BuildingName",
            Community_District: "CommunityDist",
            Document_Name: "DocName",
            Floor: "Floor",
            Project_Name: "ProjectName",
            Reason: "Reason",
            REMS_Audience: "Audience",
            REMS_Author: "REMSAuthor",
            REMS_Date: "REMSDate",
            Topic: "Topic"                   
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
                        <span className="lblContent">BIN <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please BIN Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BIN")} value={this.state.BIN} id="txtBIN" placeholder='Enter BIN details here' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Building Name <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Building Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BuildingName")} value={this.state.BuildingName} id="txtBuildingName" placeholder='Enter Building Name' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <label className="lblContent">Community District <span className="mandatory"/> <span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Community District Number"> <i className="fa fa-info-circle infoIcon"/> </span> </label>
                        <input type="number" className="form-control" disabled={isDisabled} value={this.state.CommunityDist} id="txtCommunityDist" min={1} step={1} onChange={(e) => { const value = e.target.value; this.changeTextValue(value, "CommunityDist"); }} />
                    </div>
                </div>
                <div className="form-group row">                   
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Document Name <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Document Information"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "DocName")} value={this.state.DocName} id="txtElectedOff" placeholder='Enter document information' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Floor<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Floor Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Floor")} value={this.state.Floor} id="txtREMSProcess" placeholder='Enter floor details' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Project Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Project Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ProjectName")} value={this.state.ProjectName} id="txtULURPNo" placeholder='Enter Project Name' />
                    </div>
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Reason<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Project Name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ProjectName")} value={this.state.ProjectName} id="txtULURPNo" placeholder='Enter Project Name' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Audience<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Audience Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Audience")} value={this.state.Audience} id="txtAudience" placeholder='Enter Audience details' />
                    </div> 
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Author(REMS)<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter REMS Author"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSAuthor")} value={this.state.REMSAuthor} id="txtREMSAuthor" placeholder='Enter REMS Author' />
                    </div>
                   
                </div>               
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Date(REMS) <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Date(REMS)"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <div id="DTREMS" className="input-group date form-control scDatepicker" data-date-format="mm/dd/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.REMSDate} onChange={(e) => this.changeTextValue(e.target.value, "REMSDate")} disabled={isDisabled} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"/>
                            </span>
                        </div>                   
                    </div>  
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Topic<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Topic Details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Topic")} value={this.state.Topic} id="txtTopic" placeholder='Enter topic details' />
                    </div> 
                </div>
                                       
            </div>
        );
    }
}