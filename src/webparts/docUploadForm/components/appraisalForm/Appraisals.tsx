import * as React from "react";
import { sp } from "@pnp/sp";
import { IAppraisalsProps } from "./IAppraisalsProps";
//import { Constants } from "../../../../common/constants/Constants";

export interface IAppraisalsState {
    isDisabled: boolean;

    BBL: string;
    Boro: string;
    Block: string;
    Lot: string;
    DocNo: string;
    REMSAddress: string;
    ApplicantName: string;
    resOnboardDt: string;

    AppraiserReason: string;
    AppraiserName: string;
    BIN: string;
    Buyer: string;

    CommunityDist: string;
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
    isDocNoEmpty: boolean;
    isREMSAddressEmpty: boolean;
    isLoading: boolean;  
}

export interface IAppraisalFormData extends IAppraisalsState {
    isValid: boolean;
}

export default class Appraisals extends React.Component<IAppraisalsProps, IAppraisalsState> {    
    constructor(props: IAppraisalsProps) {        
        super(props);
        //set up spsite URL
        sp.setup({ sp: { baseUrl: this.props.siteAbsoluteURL } });
        this.state = {
            isDisabled: false,

            BBL: "",
            Boro: "",
            Block: "",
            Lot: "",
            DocNo: "",
            REMSAddress: "",
            ApplicantName: "",
            resOnboardDt: "",

            AppraiserReason: "",
            AppraiserName: "",
            BIN: "",
            Buyer: "",

            CommunityDist: "",
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
            isDocNoEmpty: false,
            isREMSAddressEmpty: false,
            isLoading: false
        };
    }

    public componentDidMount(): void {
        const { reqID, mode, libName} = this.props;
        if (reqID && (mode === "edit" || mode === "view")) {
            this.setState({ isLoading: true, isDisabled: mode === "view" });
            this.fetchAppraisalData(reqID, libName);
        } else {
            this.setState({ isDisabled: false }); // create mode
        }
    }

    public componentDidUpdate(prevProps: IAppraisalsProps): void {
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


    private changeTextValue = (updatedVal: string, field: keyof IAppraisalsState): void => {
        this.setState(prevState => ({
            ...prevState,
            [field]: updatedVal
        }), () => {
            this.validateAndSendData();
        });
    }

    private validateAndSendData = (): void => {
        const { BBL, Boro, Block } = this.state;

        const isBBLEmpty = BBL.trim() === "";
        const isBoroEmpty = Boro.trim() === "";
        const isBlockEmpty = Block.trim() === "";
        const isValid = !isBBLEmpty && !isBoroEmpty && !isBlockEmpty;

        this.setState({ isBBLEmpty, isBoroEmpty, isBlockEmpty });

        const formData: IAppraisalFormData = {
            ...this.state,
            isBBLEmpty,
            isBoroEmpty,
            isBlockEmpty,
            isValid
        };

        if (this.props.onFormDataChange) {
            this.props.onFormDataChange(formData);
        }
    }


    public render(): React.ReactElement<IAppraisalsProps> {
        const { isDisabled, isLoading } = this.state;
        if (isLoading) {
            return <div>Loading...</div>;
        }

        return (
            <div>                
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">BBL<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter BBL"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BBL")} value={this.state.BBL} id="txBBL" placeholder='Enter BBL' />
                        <span className={this.state.isBBLEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Boro<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Boro"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Boro")} value={this.state.Boro} id="txtBoro" placeholder='Enter Boro' />
                        <span className={this.state.isBoroEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Block<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Block"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Block")} value={this.state.Block} id="txtBlock" placeholder='Enter Block' />
                        <span className={this.state.isBlockEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Lot<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Lot"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Lot")} value={this.state.Lot} id="txtLot" placeholder='Enter Lot' />
                        <span className={this.state.isLotEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Document Number<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Document Number"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "DocNo")} value={this.state.DocNo} id="txtDocNo" placeholder='Enter document number' />
                        <span className={this.state.isDocNoEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Address(REMS)<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Address (REMS)"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSAddress")} value={this.state.REMSAddress} id="txtREMSAddress" placeholder='Enter address (REMS)' />
                        <span className={this.state.isREMSAddressEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>
                    </div>
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Applicant Name<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Applicant Name"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ApplicantName")} value={this.state.ApplicantName} id="txtApplicantName" placeholder='Enter applicant name' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Appraisal Date <span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraisal Date"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <div id="DTAppraisal" className="input-group date form-control scDatepicker" data-date-format="dd/mm/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.resOnboardDt} onChange={(e) => this.changeTextValue(e.target.value, "resOnboardDt")} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"></i>
                            </span>
                        </div>                   
                    </div>            
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Appraisal Reason<span className="mandatory">*</span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "AppraiserReason")} value={this.state.AppraiserReason} id="txtAppraiserReason" placeholder='Enter appraiser reason' />
                        <span className={this.state.isREMSAddressEmpty === true? "errorMsg" : "errorMsg d-none"}>You can&#39;t leave this blank</span>                    
                    </div>
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Appraiser Name <span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Name"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "AppraiserName")} value={this.state.AppraiserName} id="txtAppraiserName" placeholder='Enter appraiser name' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">BIN <span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter BIN Information"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "BIN")} value={this.state.BIN} id="txtBIN" placeholder='Enter BIN' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Buyer <span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Buyer Information"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Buyer")} value={this.state.Buyer} id="txtBuyer" placeholder='Enter buyer' />
                    </div>
                </div>
                <div className="form-group row">
                    {/* <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent"> No of Resource Required? <span className="mandatory">*</span> <span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter No Of Resource"> <i className="fa fa-info-circle infoIcon"></i> </span> </span>
                        <input type="number" className="form-control" disabled={this.state.isReadOnlyNoOfResource} onChange={(e) => { const value = e.target.value; if (value === '' || /^\d+$/.test(value)) { this.changeTextValue(value, "NoOfResource"); } }} value={this.state.NoOfResource} id="txtNoOfResource" placeholder="Enter No Of Resource" min="0" />
                    </div> */}

                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Community District <span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "CommunityDist")} value={this.state.CommunityDist} id="txt" placeholder='Enter Community District' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Fixed Asset Number <span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "FixedAssetNo")} value={this.state.FixedAssetNo} id="txtAppraiserReason" placeholder='Enter Fixed Asset Number' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Floor <span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Floor")} value={this.state.Floor} id="txtAppraiserReason" placeholder='Enter Floor Details' />
                    </div>
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Linked to REMS Process<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "REMSProcess")} value={this.state.REMSProcess} id="txtOccupant" placeholder='Enter Linked to REMS Process' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Occupant/Squatter<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Appraiser Reason"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Occupant")} value={this.state.Occupant} id="txtOccupant" placeholder='Enter Occupant/Squatter' />
                    </div> 
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Project Name<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Project Name"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ProjName")} value={this.state.ProjName} id="txtProjName" placeholder='Enter project name' />
                    </div> 
                </div>
                <div className="form-group row">
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Property Name<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Property Name"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "PropertyName")} value={this.state.PropertyName} id="txtPropName" placeholder='Enter property name' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Review Appraiser<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Review Appraiser"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "ReviewAppraiser")} value={this.state.ReviewAppraiser} id="txtReviewAppraiser" placeholder='Enter review appraiser here' />
                    </div> 
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Review Appraiser Date<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Review Appraiser Date"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <div id="DTReviewAppraiser" className="input-group date form-control scDatepicker" data-date-format="dd/mm/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.ReviewAppraiserDt} onChange={(e) => this.changeTextValue(e.target.value, "ReviewAppraiserDt")} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"></i>
                            </span>
                        </div>                   
                    </div>
                </div>
                <div className="form-group row">                   
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Second Appraisal Date<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Second Appraisal Date"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <div id="DTSecondAppraisal" className="input-group date form-control scDatepicker" data-date-format="dd/mm/yyyy">
                            <input className="form-control inputCalendarbox" type="text" value={this.state.SecondAppraisalDt} onChange={(e) => this.changeTextValue(e.target.value, "SecondAppraisalDt")} />
                            <span className="input-group-addon iconCalendarContainer">
                                <i className="glyphicon glyphicon-calendar iconCalendar"></i>
                            </span>
                        </div>                   
                    </div>
                     <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Second Appraiser<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Second Appraiser"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "SecondAppraiser")} value={this.state.SecondAppraiser} id="txtSecondAppraiser" placeholder='Enter second appraiser here' />
                    </div>
                    <div className="col-md-4 col-lg-4 col-xs-12">
                        <span className="lblContent">Seller<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Seller Details"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "Seller")} value={this.state.Seller} id="txtSeller" placeholder='Enter seller details here' />
                    </div> 
                </div>
                <div className="form-group row">
                    <div className="col-md-12 col-lg-12 col-xs-12">
                        <span className="lblContent">Tenant Name<span className="mandatory"></span><span data-toggle="tooltip" className="infoCircle-bottom" title="Please Enter Tenant Name"><i className="fa fa-info-circle infoIcon"></i></span></span>
                        <input type="text" className="form-control" disabled={isDisabled} onChange={(e) => this.changeTextValue(e.target.value, "TenantName")} value={this.state.TenantName} id="txtTenant" placeholder='Enter tenant details here' />
                    </div> 
                </div>                
            </div>
        );
    }
}