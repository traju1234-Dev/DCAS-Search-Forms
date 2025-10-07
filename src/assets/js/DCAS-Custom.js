$(document).ready(function() {	
	//Information circle tooltip
	$(".infoCircle-bottom").tooltip({
		placement: 'bottom',
		trigger: "hover"
	}); 
    
	let flag=false;    
	// Create form tooltip show/d-none
	$(".infoIcon").on("click",function(){
        flag=true;
		if($(this).parent().find(".infoTooltip").hasClass("d-none")) {
			$(".infoIcon").removeClass("arrowTooltip");
			$(".infoTooltip").addClass("d-none");
			$(this).addClass("arrowTooltip").parent().find(".infoTooltip").removeClass("d-none");
		} else {
			$(this).removeClass("arrowTooltip").parent().find(".infoTooltip").addClass("d-none");
		}		
		$(document).click(function(e){						
			if(!$(e.target).closest(".infoIcon").length) {
				$(".infoTooltip").addClass("d-none");
				$(".infoIcon").removeClass("arrowTooltip");
			}
		});
	});	
	$(document).click(function(e){		
		if(flag==true)
			$('[data-toggle="tooltip"]').tooltip("hide");
		else
			flag=false;
	});

	

	// /***********Create Request Form Started*************/
	// //Display uploaded documents when the page is loaded on Create Request Form
	// if ($('#NewResReqAttachments ul>li').length!=0){
	// 	$("#NewResReqAttachments").removeClass("d-none");
	// }
	// if ($('#NewResReqAttachments ul>li').length!=0){
	// 	$("#NewResReqAttachments").removeClass("d-none");
	// }
	// /***********Create Request Form Ended**************/

	// /***********Submit Request Form Started**************/
	// //Display  uploaded documents when the page is loaded on Submit Request Form
	// if ($('#NewResReqAttachments ul>li').length!=0){
	// 	$("#NewResReqAttachments").removeClass("d-none");
	// }
	// //Display Quotes uploaded documents when the page is loaded on Submit Request Form
	// if ($('#NewResReqAttachments ul>li').length!=0){
	// 	$("#NewResReqAttachments").removeClass("d-none");
	// }
	// //Remove  Document Ref from Uploaded Section
	// $(".submitQuoteCloseIcon").on("click",function(){
	// 	$(this).parent().remove();
	// 	if($("#NewResReqAttachments ul>li").length == 0) {
	// 		$("#NewResReqAttachments").addClass("d-none");
	// 	}
	// });
	// //Remove Quote Document Ref from Uploaded Section
	// $(".submitQuoteCloseIcon").on("click",function(){
	// 	$(this).parent().remove();
	// 	if($("#NewResReqAttachments ul>li").length == 0) {
	// 		$("#NewResReqAttachments").addClass("d-none");
	// 	}
	// });
	// /***********Submit Request Form Ended**************/

	// /***********Edit Request Form Started**************/
	// //Display  uploaded documents when the page is loaded on Edit Request Form
	// if ($('#divEditUploadedQuotes ul>li').length!=0){
	// 	$("#divEditUploadedQuotes").removeClass("d-none");
	// }
	// $(".editCloseIcon").on("click",function(){
	// 	$(this).parent().remove();
	// 	if($("#divEditUploadedQuotes ul > li").length == 0) {
	// 		$("#divEditUploadedQuotes").addClass("d-none");
	// 	}
	// });
	// /***********Edit Request Form Ended**************/
});
