$(document).ready(function(){

	//functions


	// Tabs
	{
		var tabObj = {
			'tab-monitor-link': '#tab-monitor',
			'tab-history-link': '#tab-history',
			'settings-link': '#settings'
		};
		$('.tab').click(function(){
			var visiblePage = tabObj[$(this).attr('id')];
			$('.tab').removeClass('selected');
			$(this).addClass('selected');
			$('.tab-content').hide();
			$(visiblePage).show();
		});
	}
	// Settings
	{
		// Checkboxes and dependent items
		{
			var checkboxes = $("input[type='checkbox']");

			$(checkboxes).each(function(){
				if($(this).is(":not(:checked)")){
					var item = $(this).attr('id');
					var dependent = '.'+item+'-dependent';
					$(dependent).find('input, select, button').prop('disabled', function(i, v) { return !v; });
					$(dependent).find('td').toggleClass('grey');
				}
			});

			$(checkboxes).click(function(){
				var item = $(this).attr('id');
				var dependent = '.'+item+'-dependent';
				$(dependent).find('input, select, button').prop('disabled', function(i, v) { return !v; });
				$(dependent).find('td').toggleClass('grey');
			});
		}
		//Buttons
		{
			/** Any element in class .change-view-button:
					Must have a div with an id identical this this
					appended with '-view'
				
					Must have a tab with an id identical this this
					appended with '-tab'
			*/
			$('.change-view-button').click(function(){
				var item = $(this).attr('id');
				var view = '#'+item+'-view';
				var tab = '#'+item+'-tab';
				$('#settings-view').hide();
				$('.tab-container').children().hide();
				$(tab + ',' + view).fadeIn();
			});

			$('.list-form-buttons').click(function(){
				$('.tab-container').children().show();
				$('#list-button-tab,#list-button-view').hide();
				$('#settings-view').show();
			});
		}
	}
});