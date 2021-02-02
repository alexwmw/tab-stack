
$(document).ready(function(){

	$('.tab').click(function(){
	  	var obj = {
			'tab-monitor-link': '#tab-monitor',
			'tab-history-link': '#tab-history',
			'settings-link': '#settings'
		};
		var openContent = obj[$(this).attr('id')];
		$('.tab').not(this).removeClass('selected');
		$(this).addClass('selected');
		$('.tab-content').not(openContent).hide();
		$(openContent).show();
	});



	$('#Q-group-tabs').click(function() {
    	$("#Q-group-by").toggleClass('greyed-out',this.checked == false);
    	$("#Q-warn-close").toggleClass('greyed-out',this.checked == false);
    	if($( "#O-group-by" ).prop( "disabled")){
    		$( "#O-group-by" ).prop( "disabled", false );
    		$( "#O-warn-close" ).prop( "disabled", false );
    	}
    	else{
    		$( "#O-group-by" ).prop( "disabled", true );
    		$( "#O-warn-close" ).prop( "disabled", true );
    	}
	});

	$('#Q-warn-group-close').click(function() {
    	$("#Q-warn-timeout").toggleClass('greyed-out',this.checked == false);
    	 if($( "#warn-timout-m" ).prop( "disabled")){
    		$( "#warn-timout-m" ).prop( "disabled", false );
    		$( "#warn-timout-s" ).prop( "disabled", false );
    	}
    	else{
    		$( "#warn-timout-m" ).prop( "disabled", true );
    		$( "#warn-timout-s" ).prop( "disabled", true );
    	}
	});





});