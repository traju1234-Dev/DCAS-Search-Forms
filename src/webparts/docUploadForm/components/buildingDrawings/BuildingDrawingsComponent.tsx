import * as React from "react";
import { sp } from "@pnp/sp";
import { IGeneralDocsProps } from "../IGeneralDocsProps";

export interface IBuildingDrawingsComponentState {
    isDisabled: boolean;
    BBL: string;
    Boro: string;
    Block: string;
    isBBLEmpty: boolean;
    isBoroEmpty: boolean;
    isBlockEmpty: boolean;
    isLoading: boolean;
}

export interface IBuildingDrawingsData extends IBuildingDrawingsComponentState {
    isValid: boolean;
    metadata?: Record<string, any>;
}

export default class BuildingDrawingsComponent extends React.Component<IGeneralDocsProps, IBuildingDrawingsComponentState> {
    constructor(props: IGeneralDocsProps) {
        super(props);
        sp.setup({ sp: { baseUrl: this.props.siteAbsoluteURL } });
        this.state = {
            isDisabled: false,
            BBL: "",
            Boro: "",
            Block: "",
            isBBLEmpty: false,
            isBoroEmpty: false,
            isBlockEmpty: false,
            isLoading: false
        };
    }

    public async componentDidMount(): Promise<void> {
        ($('.infoCircle-bottom') as any).tooltip({
            placement: 'bottom',
            trigger: "hover"
        });

        const { reqID, mode, libName } = this.props;
        if (reqID && (mode === "edit" || mode === "view")) {
            this.setState({ isLoading: true, isDisabled: mode === "view" });
            this.fetchAppraisalData(reqID, libName);
        } else {
            this.setState({ isDisabled: false });
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

    private changeTextValue = (updatedVal: string, field: keyof IBuildingDrawingsComponentState): void => {
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
        const metadata = this.buildMetadataForSharePoint();
        if (this.props.onFormDataChange) {
            this.props.onFormDataChange(metadata, isValid);
        }
    }

    private buildMetadataForSharePoint = (): Record<string, any> => {
        const fieldMapping: { [key: string]: keyof IBuildingDrawingsComponentState } = {
            BBL: "BBL",
            Boro: "Boro",
            Block: "Block"
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
            </div>
        );
    }
}