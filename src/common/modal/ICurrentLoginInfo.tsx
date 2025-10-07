import { IGroupInfo } from "./IGroupInfo";

export interface ICurrentLoginInfo 
{ 
    ID:number;
    UserEmail: string;
    Name: string;   
    Groups: IGroupInfo[];
    IsAdmin: boolean;
    GroupOrMemberIds: number[];
    GroupOrMemberInfo: IGroupInfo[];
    ADGroups:IGroupInfo[];
}
