import * as React from "react";
import { sp } from "@pnp/sp";
import { IGeneralDocsProps } from "../IGeneralDocsProps";
import DataService from "../../../../common/service/DataService";

export interface IPolicyProcedureComponentState {
    isDisabled: boolean;
    BBL: string;
    Boro: string;
    Block: string;
    Lot: string;   
    REMSAddress: string;

    Agency: string;
    BuildingName: string;
    CommunityDist: number;
    DocDate: string;
    Floor: string;

    LineofService: string;
    REMSProcess: string;
    LocalLawDescription: string;
    LocalLawNumber: number;
    LocalLawYear: string;

    MOUType: string;
    PolicyProcedureName: string;
    ProcessName: string;
    ProjectName: string;
    REMSModule: string;

    ResCCNo: number;
    ResCCDate: string;
    SubUnit: string;
    SunsetDate: string;
    TemplateName: string;

    ULURPNo:string;
    ULURPSuffix: string;
    Unit: string;

    isBBLEmpty: boolean;
    isBoroEmpty: boolean;
    isBlockEmpty: boolean;
    isLotEmpty: boolean;
    isLoading: boolean;
}

export interface IPolicyProcedureData extends IPolicyProcedureComponentState {
    isValid: boolean;
    metadata?: Record<string, any>;
}

export default class PolicyProcedureComponent extends React.Component<IGeneralDocsProps, IPolicyProcedureComponentState> {
    private dataService: DataService; 
    constructor(props: IGeneralDocsProps) {
        super(props);
        sp.setup({ sp: { baseUrl: this.props.siteAbsoluteURL } });
        this.state = {
            isDisabled: false,
            BBL: "",
            Boro: "",
            Block: "",
            Lot: "",
            REMSAddress: "",
            Agency: "",
            BuildingName: "",
            CommunityDist: 0,
            DocDate: "",
            Floor: "",
            LineofService: "",
            REMSProcess: "",
            LocalLawDescription: "",
            LocalLawNumber: 0,
            LocalLawYear: "",
            MOUType: "",
            PolicyProcedureName: "",
            ProcessName: "",
            ProjectName: "",
            REMSModule: "",
            ResCCNo: 0,
            ResCCDate: "",
            SubUnit: "",
            SunsetDate: "",
            TemplateName: "",
            ULURPNo:"",
            ULURPSuffix: "",
            Unit: "",
            isBBLEmpty: false,
            isBoroEmpty: false,
            isBlockEmpty: false,
            isLotEmpty: false,
            isLoading: false
        };
    }

    public async componentDidMount(): Promise<void> {
        this.dataService = new DataService(this.context, this.props.context.pageContext.web.absoluteUrl);
        ($('.infoCircle-bottom') as any).tooltip({
            placement: 'bottom',
            trigger: "hover"
        });

        const { reqID, mode, libName } = this.props;
        if (reqID && (mode === "edit" || mode === "view")) {
            this.setState({ isLoading: true, isDisabled: mode === "view" });
            this.fetchAppraisalData(reqID, libName);
            this.bindDates();
        } else {
            this.setState({ isDisabled: false });
            this.bindDates();
        }
    }

    private bindDates(): void {
            const dateFields: { id: string; key: keyof IPolicyProcedureComponentState }[] = [
                { id: 'DTDocDate', key: 'DocDate' }, 
                { id: 'DTResCCDate', key: 'ResCCDate' }, 
                { id: 'DTSunsetDate', key: 'SunsetDate' }, 
            ];
            dateFields.forEach(({ id, key }) => this.initializeDatePicker(id, key));
        }   
        
        private initializeDatePicker<T extends keyof IPolicyProcedureComponentState>(elementId: string, stateKey: T): void {
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

    public componentWillUnmount(): void {
        ($('.infoCircle-bottom') as any).tooltip("dispose");
    }

    public componentDidUpdate(prevProps: IGeneralDocsProps): void {
        if (this.props.isSubmitTriggered && !prevProps.isSubmitTriggered) {
            this.validateAndSendData();
        }
    }

    private async fetchAppraisalData(reqID: number, librayName: string): Promise<void> {
        this.setState({ isLoading: true });
        try {
            const item: any = await sp.web.lists
                .getByTitle(librayName)
                .items.getById(reqID)
                .select("*", "FileLeafRef", "FileRef", "FileDirRef", "EncodedAbsUrl")
                .get();

            if (item?.ID > 0) {
                this.setState({
                    BBL: item.BBL || "",
                    Boro: item.Boro || "",
                    Block: item.Block || "",
                    Lot: item.Lot,
                    REMSAddress: item.REMS_Address || "",
                    Agency: item.Agency || "",
                    BuildingName: item.Building_Name || "",
                    CommunityDist: item.Community_District || 0,
                    DocDate: this.dataService.getFormattedDate(item.Document_Date, false),
                    Floor: item.Floor || "",
                    LineofService: item.LOS || "",
                    REMSProcess: item.Linked_to_REMS_Process || "",
                    LocalLawDescription: item.Local_Law_Description || "",
                    LocalLawNumber:item.Local_Law_Number || 0,
                    LocalLawYear: item.Local_Law_Year || "",
                    MOUType: item.MOU_Type || "",
                    PolicyProcedureName: item.Policy_Procedure_Name || "",
                    ProcessName: item.Process_Name || "",
                    ProjectName: item.Project_Name || "",
                    REMSModule: item.REMS_Module || "",
                    ResCCNo: item.Resolution_CPC_CC_Calendar_Number || 0,
                    ResCCDate: this.dataService.getFormattedDate(item.Resolution_CPC_CC_Date, false),
                    SubUnit: item.SubUnit || "",
                    SunsetDate: this.dataService.getFormattedDate(item.Sunset_Date, false),
                    TemplateName: item.Template_Name || "",
                    ULURPNo:item.ULURP_Number || "",
                    ULURPSuffix: item.ULURP_Suffix || "",
                    Unit: item.Unit || "",
                    isLoading: false
                }, () => {
                    this.validateAndSendData();
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

    private changeTextValue = (updatedVal: string, field: keyof IPolicyProcedureComponentState): void => {
        this.setState(prevState => ({
            ...prevState,
            [field]: updatedVal
        }), () => {
            this.validateAndSendData();
        });
    }

    private validateAndSendData = (): void => {
       const requiredFields: (keyof IPolicyProcedureComponentState)[] = [ "BBL", "Boro", "Block", "Lot" ];
        const emptyFlags: Partial<IPolicyProcedureComponentState> = {};
        let isValid = true;

        requiredFields.forEach(field => {
            const value = this.state[field];
            const isEmpty = typeof value === "string" ? value.trim() === "" || value === "--Select--" : value === null || value === undefined;
            const flagKey = `is${field}Empty` as keyof IPolicyProcedureComponentState;
            (emptyFlags as any)[flagKey] = isEmpty;
            if (isEmpty) isValid = false;
        });

        this.setState(emptyFlags as Pick<IPolicyProcedureComponentState, keyof typeof emptyFlags>);
        const metadata = this.buildMetadataForSharePoint();
        if (this.props.onFormDataChange) {
            this.props.onFormDataChange(metadata, isValid);
        }
    }

    private buildMetadataForSharePoint = (): Record<string, any> => {
        const fieldMapping: { [key: string]: keyof IPolicyProcedureComponentState } = {
            BBL: "BBL",
            Boro: "Boro",
            Block: "Block",
            Lot: "Lot",
            REMS_Address: "REMSAddress",
            Agency: "Agency",
            Building_Name: "BuildingName",
            Community_District : "CommunityDist",
            Document_Date: "DocDate",
            Floor: "CommunityDist",          
            LOS: "LineofService",
            Linked_to_REMS_Process: "REMSProcess",
            Local_Law_Description: "LocalLawDescription",
            Local_Law_Number: "LocalLawNumber",
            Local_Law_Year: "LocalLawYear",
            MOU_Type: "MOUType",
            Policy_Procedure_Name: "PolicyProcedureName",
            Process_Name: "ProcessName",
            Project_Name: "ProjectName",
            REMS_Module: "REMSModule",
            Resolution_CPC_CC_Calendar_Number: "ResCCNo",
            Resolution_CPC_CC_Date: "ResCCDate",
            SubUnit: "SubUnit",
            Sunset_Date: "SunsetDate",
            Template_Name: "TemplateName",
            ULURP_Number: "ULURPNo",
            ULURP_Suffix: "ULURPSuffix",
            Unit: "Unit",
        };

        const metadata: Record<string, any> = {};
        for (const [spField, stateKey] of Object.entries(fieldMapping)) {
            metadata[spField] = this.state[stateKey];
        }
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
                        <span className="lblContent"> BBL<span className="mandatory">*</span> <span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter BBL"> <i className="fa fa-info-circle infoIcon"></i> </span> </span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BBL")} value={this.state.BBL} id="txBBL" placeholder='Enter BBL' />
                        <span className={this.state.isBBLEmpty ? "errorMsg" : "errorMsg d-none"}>You can't leave this blank</span>
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent"> Boro<span className="mandatory">*</span> <span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Boro"> <i className="fa fa-info-circle infoIcon"></i> </span> </span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Boro")} value={this.state.Boro} id="txtBoro" placeholder='Enter Boro' />
                        <span className={this.state.isBoroEmpty ? "errorMsg" : "errorMsg d-none"}>You can't leave this blank</span>
                    </div>

                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent"> Block<span className="mandatory">*</span> <span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Block"> <i className="fa fa-info-circle infoIcon"></i> </span> </span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Block")} value={this.state.Block} id="txtBlock" placeholder='Enter Block' />
                        <span className={this.state.isBlockEmpty ? "errorMsg" : "errorMsg d-none"}>You can't leave this blank</span>
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
                        <span className="lblContent">Building Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter building name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BuildingName")} value={this.state.BuildingName} id="txtBuildingName" placeholder="Enter building name" />
                    </div>
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <label className="lblContent">Community District <span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Community District Number"> <i className="fa fa-info-circle infoIcon"/> </span> </label>
                        <input type="number" className="form-control" disabled={isDisabled} value={this.state.CommunityDist} id="txtCommunityDist" placeholder="Enter Community District Number" min={1} step={1} onChange={(e) => { const value = e.target.value; this.changeTextValue(value, "CommunityDist"); }} />
                    </div>                   
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Document Date<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Document Date"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <div id="DTDocDate" className="input-group date form-control scDatepicker" data-date-format="mm/dd/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.DocDate} onChange={(e) => this.changeTextValue(e.target.value, "DocDate")} disabled={isDisabled} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"/>
                            </span>
                        </div>  
                    </div>
                </div>
                 <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Floor<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter floor number"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Floor")} value={this.state.Floor} id="txtFloor" placeholder="Enter floor number" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Line of Service<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter line of service"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "LineofService")} value={this.state.LineofService} id="txtLineofService" placeholder="Enter line of service" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Linked to REMS Process<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter REMS process details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSProcess")} value={this.state.REMSProcess} id="txtREMSProcess" placeholder="Enter REMS process details" />
                    </div>
                 </div>
                 <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Local Law Description<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter local law description"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "LocalLawDescription")} value={this.state.LocalLawDescription} id="txtLocalLawDescription" placeholder="Enter local law description" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Local Law Number<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter local law number"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="number" className="form-control" disabled={isDisabled} value={this.state.LocalLawNumber} id="txtLocalLawNumber"  min={1} step={1} onChange={(e) => { const value = e.target.value; this.changeTextValue(value, "LocalLawNumber"); }} />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Local Law Year<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter local law year"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "LocalLawYear")} value={this.state.LocalLawYear} id="txtLocalLawYear" placeholder="Enter local law year" />
                    </div>
                 </div>
                 <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">MOU Type<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter MOU type"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "MOUType")} value={this.state.MOUType} id="txtMOUType" placeholder="Enter MOU type" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Policy / Procedure Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter policy or procedure name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "PolicyProcedureName")} value={this.state.PolicyProcedureName} id="txtPolicyProcedureName" placeholder="Enter policy/procedure name" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Process Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter process name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ProcessName")} value={this.state.ProcessName} id="txtProcessName" placeholder="Enter process name" />
                    </div>
                 </div>
                 <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Project Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter project name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ProjectName")} value={this.state.ProjectName} id="txtProjectName" placeholder="Enter project name" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">REMS Module<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter REMS module"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSModule")} value={this.state.REMSModule} id="txtREMSModule" placeholder="Enter REMS module" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Resolution (CPC or CC) Calendar Number<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter CPC/CC calendar details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="number" className="form-control" disabled={isDisabled} value={this.state.ResCCNo} id="txtResCCNo"  min={1} step={1} onChange={(e) => { const value = e.target.value; this.changeTextValue(value, "ResCCNo"); }} />
                    </div>
                 </div>
                 <div className="form-group row">
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Resolution (CPC or CC) Date<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Resolution (CPC or CC) Date"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <div id="DTResCCDate" className="input-group date form-control scDatepicker" data-date-format="mm/dd/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.ResCCDate} onChange={(e) => this.changeTextValue(e.target.value, "ResCCDate")} disabled={isDisabled} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"/>
                            </span>
                        </div>                   
                    </div> 
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Sub-Unit<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter sub unit"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "SubUnit")} value={this.state.SubUnit} id="txtSubUnit" placeholder="Enter sub unit" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Sunset Date<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Sunset Date"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <div id="DTSunsetDate" className="input-group date form-control scDatepicker" data-date-format="mm/dd/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.SunsetDate} onChange={(e) => this.changeTextValue(e.target.value, "SunsetDate")} disabled={isDisabled} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"/>
                            </span>
                        </div>                   
                    </div> 
                 </div>
                 <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Template Name<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter template name"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "TemplateName")} value={this.state.TemplateName} id="txtTemplateName" placeholder="Enter template name" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">ULURP Number<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter ULURP number"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ULURPNo")} value={this.state.ULURPNo} id="txtULURPNo" placeholder="Enter ULURP number" />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">ULURP Suffix<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter ULURP suffix"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ULURPSuffix")} value={this.state.ULURPSuffix} id="txtULURPSuffix" placeholder="Enter ULURP suffix" />
                    </div>
                 </div>
                 <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Unit<span className="mandatory"/><span data-toggle="tooltip" className="infoCircle-bottom" title="Please enter unit details"><i className="fa fa-info-circle infoIcon"/></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Unit")} value={this.state.Unit} id="txtUnit" placeholder="Enter unite details here" />
                    </div>
                </div>
            </div>
        );
    }
}