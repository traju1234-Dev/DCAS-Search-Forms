import { sp } from "@pnp/sp/presets/all";
//import { MSGraphClientV3 } from "@microsoft/sp-http";

// Models & Interfaces
import { ICurrentLoginInfo } from "../modal/ICurrentLoginInfo";
import { IGroupInfo } from "../modal/IGroupInfo";
import { Constants } from "../constants/Constants";
import { IDocumentCategory } from "../modal/IDocumentCategory";
// ============ Data Service ============ //
export default class DataService {
    private siteAbsoluteURL: string;
        
    constructor(context: any, siteAbsoluteURL: string) {
        this.siteAbsoluteURL = siteAbsoluteURL;
        sp.setup({
            sp: {
                baseUrl: this.siteAbsoluteURL
            }
        });
    }

    // --- Current User Info ---
    public async GetCurrentUserInfo(): Promise<ICurrentLoginInfo> {
        const response = await sp.web.currentUser();
        //const adGroups = await this.getGroups();
        const spGroups = await this.CurrentUserGroups();
        const memberIds: number[] = [response.Id];
        const groupOrMemberInfo: IGroupInfo[] = spGroups.map((g) => {
            memberIds.push(g.ID);
            return { ID: g.ID, Title: g.Title, Email: g.Email, PrincipalType: g.PrincipalType };
        });

        return {
            UserEmail: response.Email,
            ID: response.Id,
            Name: response.Title,
            IsAdmin: response.IsSiteAdmin,
            ADGroups: [],
            Groups: spGroups,
            GroupOrMemberIds: memberIds,
            GroupOrMemberInfo: groupOrMemberInfo,
        };
    }

    // // --- Microsoft 365 Groups via Graph ---
    // public async getGroups(): Promise<IGroupInfo[]> {
    //     try {
    //     const client: MSGraphClientV3 = await this.context.msGraphClientFactory.getClient('3');

    //     const result = await client
    //         .api('/me/memberOf')
    //         .select('id,displayName,mail')
    //         .get();

    //     return (result?.value ?? []).map((item: any) => ({
    //         id: item.id,
    //         displayName: item.displayName,
    //         mail: item.mail || '', // mail may be null for some groups
    //     }));
    //     } catch (error) {
    //     console.error('Error in getGroups:', error);
    //     return [];
    //     }
    // }
    
    // --- SP Group Members by Group Name ---
    
    public async GetGroupMembersByName(groupName: string): Promise<IGroupInfo[]> {
        const groups: IGroupInfo[] = [];
        const res = await sp.web.siteGroups.filter(`Title eq '${groupName}'`).top(1).get();

        if (res.length > 0) {
            const groupID = res[0].Id;
            const users = await sp.web.siteGroups.getById(groupID).users();
            users.forEach((u: any) =>
            groups.push({
                ID: u.Id,
                Title: u.Title,
                Email: u.Email,
                PrincipalType: u.PrincipalType,
            })
            );
        }
        return groups;
    }

    // --- User Principal Type ---
    public async UserPrincipalType(userid: number): Promise<number> {
        try {
            const response = await sp.web.getUserById(userid).select("PrincipalType,Id").get();
            return response.PrincipalType ?? 0;
        } catch (err: any) {
            if (err.message?.includes("User cannot be found")) {
            const groupResponse = await sp.web.siteGroups.getById(userid).select("PrincipalType,Id").get();
            return groupResponse.PrincipalType ?? 0;
            }
            console.error("Error in UserPrincipalType:", err);
            return 0;
        }
    }

    // --- Current User SP Groups ---
    public async CurrentUserGroups(): Promise<IGroupInfo[]> {
        const response = await sp.web.currentUser.groups.get();
        return response.map((g: any) => ({
            ID: g.Id,
            Title: g.Title,
            Email: g.LoginName || "",
            PrincipalType: g.PrincipalType ?? 0,
        }));
    }

    // --- URL Helpers ---
    public getURLParam(keyParam: string): string {
        if (typeof window === "undefined") return "";
        return new URL(window.location.href).searchParams.get(keyParam) ?? "";
    }

    public updateURLParam(keyParam: string, value?: string): void {
        if (typeof window === "undefined") return;
        const currentURL = new URL(window.location.href);
        if (value && value.trim()) currentURL.searchParams.set(keyParam, value.trim());
        else currentURL.searchParams.delete(keyParam);
        window.history.replaceState({}, "", currentURL.toString());
    }
  
    //Redirect to dashboard
    public async RedirectToDashboard(webURL: string): Promise<void> {
        try {
            window.location.replace(webURL + "/" + Constants.Key_DashboardURL);
        } catch (error) {
            console.error("Data Services - RedirectToDashboard" + error);
        }
    }
    
    public async getDocumentCategories(): Promise<IDocumentCategory[]> {
        const response = await sp.web.lists
            .getByTitle(Constants.List_DocumentCategory)
            .items
            .select("Title", "IsActive")
            .top(4999)
            .getAll();

        const uniqueMap = new Map<string, IDocumentCategory>();
        response.forEach((item: any) => {
            // Only include items where IsActive is true or 1
            if ((item.IsActive === true || item.IsActive === 1) && !uniqueMap.has(item.Title)) {
            uniqueMap.set(item.Title, {
                Title: item.Title,
                IsActive: item.IsActive
            });
            }
        });
        // Return sorted unique values
        return Array.from(uniqueMap.values()).sort((a, b) =>
            a.Title.localeCompare(b.Title)
        );
    }

    public getFormattedDate(inputDate: any, applyFormat: boolean): string {
        if (!inputDate) return "";

        const date = new Date(inputDate);
        if (isNaN(date.getTime())) return "";

        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthShort = monthShortNames[date.getMonth()];

        let formattedDate = applyFormat
            ? `${day}-${monthShort}-${year}`   // e.g., 12-Oct-2025
            : `${month}/${day}/${year}`;       // e.g., 10/12/2025

        return formattedDate === "01/01/1970" ? "" : formattedDate;
    }

    //This function validate Query String or not **/
    public async HasQueryStringParam(viewType: string, requestId: number): Promise<boolean> {
        let IsValidParam = false;
        if (((viewType === "edit" || viewType === "view") && requestId > 0) || viewType === "create")
            IsValidParam = true;
        else
            IsValidParam = false;
        return IsValidParam;
    }

    //This function validate the required form fields
    public ValidateEmptyColumn(state: any, colName: any): boolean {
        console.log(state[colName]);
        if (state[colName] !== undefined && state[colName] !== null) {
            const item = state[colName].filter((i: any) => (i !== null && i !== "" && i !== undefined && i === colName)).length;
            if (item > 0)
                return true;
            else
                return false;
        } else {
            return false;
        }
    }

    //Get Unique values from list 
    public FilterDropdownValues(AllDropdownValues: any, ColKey: string): any {
        let FilterVal;
        //check having all dropdown items from LOV Dropdown List
        if (AllDropdownValues.length > 0) {            
            if (ColKey.toLocaleLowerCase() === "soft skills" || ColKey.toLocaleLowerCase() === "candidate status") {
                //Populate "ColKey title values" Field dropdown values
                FilterVal = AllDropdownValues.filter((i: any) => (i.ColumnName !== null && i.ColumnName !== "" && i.ColumnName !== undefined && i.ColumnName === ColKey && i.IsActiveVal === true)).sort((a: any, b: any) => {
                    if (a.ColumnValue.toLowerCase() < b.ColumnValue.toLowerCase())
                        return -1;
                    if (a.ColumnValue.toLowerCase() > b.ColumnValue.toLowerCase())
                        return 1;
                    return 0;
                }).map(({ ColumnValue }: any) => ({ text: ColumnValue, isSelected: false }));
                FilterVal = this.UniqeArray(FilterVal, "text");
            }
            else {
                //Populate "ColKey title values" Field dropdown values
                FilterVal = AllDropdownValues.filter((i: any) => (i.ColumnName !== null && i.ColumnName !== "" && i.ColumnName !== undefined && i.ColumnName === ColKey && i.IsActiveVal === true)).sort((a: any, b: any) => {
                    if (a.ColumnValue.toLowerCase() < b.ColumnValue.toLowerCase())
                        return -1;
                    if (a.ColumnValue.toLowerCase() > b.ColumnValue.toLowerCase())
                        return 1;
                    return 0;
                }).map(({ ColumnValue }: any) => ({ key: ColumnValue, text: ColumnValue, value: ColumnValue, id: ColumnValue, label: ColumnValue }));
                FilterVal = this.UniqeArray(FilterVal, "text");
            }
        }
        return FilterVal;
    }

    //Get Unique values from list 
    public UniqeArray(ArraryValues: any, key: string): any[] {
        const flags = [], output = [], ArrayCount = ArraryValues.length;
        for (let i = 0; i < ArrayCount; i++) {
            if (flags[ArraryValues[i][key]]) continue;
            flags[ArraryValues[i][key]] = true;
            output.push(ArraryValues[i]);
        }
        return output;
    }
   
    //Generating Unique Identifier for "Fabric Poft Form"
    public GenUniqueIdentifier(itemId: any): string {
        let ReqID = "";
        if (itemId > 0) {
            ReqID = Constants.Key_RequestIDFormat + itemId;
        }
        else {
            ReqID = Constants.Key_DraftRequestIDFormat;
        }
        return ReqID;
    }  

    //Check string null or empty
    public CheckStringNullOrEmpty(validString: string): string {
        return (validString !== "" && validString !== undefined && validString !== null) ? validString : "";
    }    
}