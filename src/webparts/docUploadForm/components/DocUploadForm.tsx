
import * as React from 'react';
import styles from './DocUploadForm.module.scss';
import type { IDocUploadFormProps } from './IDocUploadFormProps';
import { FluentProvider } from '@fluentui/react-provider';
import { webLightTheme } from '@fluentui/react-components';

// Import the actual form components
//import DocUploadEdit from '../components/DocUploadEdit/docUploadEdit';
//import DocUploadView from '../components/DocUploadView/docUploadView';
import DocUploadNew from './docUploadNew/DocUploadNew';


import { SPComponentLoader } from '@microsoft/sp-loader';
// ✅ Fix jQuery global assignment
import * as $ from 'jquery';
(window as any).$ = $;
(window as any).jQuery = $;

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css';
import '../../../assets/css/DCAS-Custom.css';

// Import JS
import 'bootstrap/dist/js/bootstrap.min.js';
import 'bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js';
import '../../../assets/js/DCAS-Custom.js';

// Load external CSS (e.g., Font Awesome)
SPComponentLoader.loadCss('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css');


export default class DocUploadForm extends React.Component<IDocUploadFormProps> {
  public render(): JSX.Element {  
    const { context, currentLoginInfo, viewType, reqID, docCategories, docUploadSiteURL, libName} = this.props;    
    const isValidParameter = true; // You can replace this with actual validation logic    
    return (
      <FluentProvider theme={webLightTheme}>
        <div className={styles.docUploadForm}>
          {isValidParameter ? (
            <div>
                <DocUploadNew
                  context={context}
                  currentLoginInfo={currentLoginInfo}
                  docCategories={docCategories}
                  docUploadSiteURL ={docUploadSiteURL}
                  viewType = {viewType} 
                  requestId={reqID}   
                  libName ={libName}              
                />
              {/* {viewType === "edit" && reqID > 0 && (
                <DocUploadEdit
                  context={context}
                  currentLoginInfo={currentLoginInfo}
                  requestId={reqID}
                  docUploadURL ={docUploadURL}
                  viewType ="edit"                 
                />
              )}
              {viewType === "view" && reqID > 0 && (
                <DocUploadView
                  context={context}
                  currentLoginInfo={currentLoginInfo}
                  requestId={reqID}
                  docUploadURL ={docUploadURL}
                  viewType ="view"
                />
              )}
              {viewType === "create" && (
                <DocUploadNew
                  context={context}
                  currentLoginInfo={currentLoginInfo}
                  docCategories={docCategories}
                  docUploadURL ={docUploadURL}
                  viewType ="create" 
                  requestId={reqID}                 
                />
              )} */}
            </div>
          ) : (
            <div>No Details found</div>
          )}
        </div>
      </FluentProvider>
    );
  }
}