import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import * as strings from 'DocUploadFormWebPartStrings';
import DocUploadForm from './components/DocUploadForm';
import { IDocUploadFormProps } from './components/IDocUploadFormProps';
import DataService from '../../common/service/DataService';
import { ICurrentLoginInfo } from '../../common/modal/ICurrentLoginInfo';
import { IDocumentCategory } from '../../common/modal/IDocumentCategory';

export interface IDocUploadFormWebPartProps {  
  currentLoginInfo: ICurrentLoginInfo;
  docUploadSiteURL: string;
  viewType: string;
  reqID: number;
  docCategories: IDocumentCategory[];
}

export default class DocUploadFormWebPart extends BaseClientSideWebPart<IDocUploadFormWebPartProps> {  
  private dataService: DataService;
  private userContextInfo: ICurrentLoginInfo;
  private viewType: string = '';
  private RequestId: number = 0;
  private libraryName: string = '';
  private docCategories: IDocumentCategory[] = [];

  public async onInit(): Promise<void> {
    this.dataService = new DataService(this.context, this.context.pageContext.site.absoluteUrl);
    const queryParms = new URLSearchParams(window.location.search);
    const mode = queryParms.get("mode");
    this.viewType = mode ? mode.toLowerCase() : "create";
    console.log(this.viewType);

    const rid = queryParms.get("reqid");
    this.RequestId = rid ? Number(rid) : 0;
    console.log(this.RequestId);

    const paramLib = queryParms.get("lib");
    this.libraryName = paramLib ?  paramLib : "";
    console.log(this.libraryName);

    try {
      this.userContextInfo = await this.dataService.GetCurrentUserInfo();
      this.docCategories = await this.dataService.getDocumentCategories();    
    } catch (error) {
      console.error("Error fetching user info:", error);
      this.userContextInfo = {} as ICurrentLoginInfo;
    }
  }
 
  public render(): void {
    const element: React.ReactElement<IDocUploadFormProps> = React.createElement(
      DocUploadForm,
      {
        context: this.context,
        currentLoginInfo: this.userContextInfo,
        docUploadSiteURL:this.properties.docUploadSiteURL,
        viewType: this.viewType,
        reqID: this.RequestId,
        libName: this.libraryName,
        docCategories: this.docCategories,
      }
    );
    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [            
            {            
              groupFields: [
                
                 PropertyPaneTextField('docUploadSiteURL', {
                  label: 'Document upload Site URL'
                })
              ]             
            },
          ]
        }
      ]
    };
  }
}
