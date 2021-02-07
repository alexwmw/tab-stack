$(document).ready(function(){

	const keyCodes = {
		0: '',
		91: '\u2318',
		93: '\u2318',
		92: 'windows',
		16: 'shift',
		17: 'ctrl',
		18: 'alt',
		3: 'break',
		8: 'backspace',
		9: 'tab',
		12: 'clear',
		13: 'enter',
		19: '',
		20: '',
		21: '',
		25: '',
		27: '',
		28: '',
		29: '',
		32: '',
		33: 'pageup',
		34: 'pagedown',
		35: 'end',
		36: 'home',
		37: '',
		38: '',
		39: '',
		40: '',
		41: '',
		42: '',
		43: '',
		44: '',
		45: 'insert',
		46: 'delete',
		47: '',
		48: '0',
		49: '1',
		50: '2',
		51: '3',
		52: '4',
		53: '5',
		54: '6',
		55: '7',
		56: '8',
		57: '9',
		58: ':',
		59: '=',
		60: '<',
		61: '',
		63: 'ß',
		64: '@',
		65: 'a',
		66: 'b',
		67: 'c',
		68: 'd',
		69: 'e',
		70: 'f',
		71: 'g',
		72: 'h',
		73: 'i',
		74: 'j',
		75: 'k',
		76: 'l',
		77: 'm',
		78: 'n',
		79: 'o',
		80: 'p',
		81: 'q',
		82: 'r',
		83: 's',
		84: 't',
		85: 'u',
		86: 'v',
		87: 'w',
		88: 'x',
		89: 'y',
		90: 'z',
		95: 'sleep',
		96: 'n0',
		97: 'n1',
		98: 'n2',
		99: 'n3',
		100: 'n4',
		101: 'n5',
		102: 'n6',
		103: 'n7',
		104: 'n8',
		105: 'n9',
		106: '*',
		107: '+',
		108: '.',
		109: '-',
		110: '.',
		111: '/',
		112: 'f1',
		113: 'f2',
		114: 'f3',
		115: 'f4',
		116: 'f5',
		117: 'f6',
		118: 'f7',
		119: 'f8',
		120: 'f9',
		121: 'f10',
		122: 'f11',
		123: 'f12',
		124: 'f13',
		125: 'f14',
		126: 'f15',
		127: 'f16',
		128: 'f17',
		129: 'f18',
		130: 'f19',
		131: 'f20',
		132: 'f21',
		133: 'f22',
		134: 'f23',
		135: 'f24',
		136: 'f25',
		137: 'f26',
		138: 'f27',
		139: 'f28',
		140: 'f29',
		141: 'f30',
		142: 'f31',
		143: 'f32',
		144: 'numlock',
		145: 'scrolllock',
		151: '',
		160: '^',
		161: '!',
		162: '؛',
		163: '#',
		164: '$',
		165: 'ù',
		166: 'page backward',
		167: 'page forward',
		168: 'refresh',
		169: 'closing paren (AZERTY)',
		170: '*',
		171: '~ + * key',
		172: 'homekey',
		173: '',
		174: '',
		175: '',
		176: '',
		177: '',
		178: '',
		179: '',
		180: '',
		181: '',
		182: '',
		183: '',
		186: ';',
		187: '=',
		188: ',',
		189: '-',
		190: '.',
		191: '/',
		192: '',
		193: '?',
		194: '.',
		219: '(',
		220: '\\',
		221: ')',
		222: '\'',
		223: '`',
		224: 'cmd',
		225: 'altgr',
		226: '//',
		230: '',
		231: '',
		233: '',
		234: '',
		235: '',
		240: '',
		242: '',
		243: '',
		244: '',
		251: '',
		255: '',
	  };
	const functionKeys = {
		8: 'backspace',
		13: 'enter',
		46: 'delete',
		95: 'sleep',
		144: 'numlock',
		145: 'scrolllock',
		166: 'page backward',
		167: 'page forward',
		168: 'refresh',
		172: 'homekey'
	};
	const cmd = [
		91,
		93,
		92,
		16,
		17,
		18,
	]
	// Get Parameter By Name:
		// Open to settings if open-settings=1
	function getParameterByName(name) {
		name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	$(function() {
        $(document).bind("myCustomEvent", function(e, data) {
			$('#settings-tab-link').trigger('click');
        });
        var eventId = getParameterByName('open-settings');  // Load the query string specified by the previous page's link
        if(eventId == 1) {
            $(document).trigger("myCustomEvent", {EventId: eventId});
        } 
		else {
        } // end if/else
    });


		
		$(document).keydown(function(e) {
			var nextTab = 
				$('.selected').next('.tab').length ?
				$('.selected').next('.tab') :
				$('.tab').first();
			var prevTab = 
				$('.selected').prev('.tab').length ?
				$('.selected').prev('.tab') :
				$('.tab').last();
			if (e.ctrlKey && e.which == 9) {
				e.preventDefault();
				$(nextTab).trigger('click');
				$(nextTab).focus();
			}
			if (e.ctrlKey && e.shiftKey && e.which == 9) {
				e.preventDefault();
				$(prevTab).trigger('click');
				$(prevTab).focus();
			}
		})
	// Tabs & settings button
	{
		var tabObj = {
			'tab-monitor-link': '#tab-monitor',
			'tab-history-link': '#tab-history',
			'settings-tab-link': '#settings',
			'settings-link': '#settings'
		};
		$('.tab').click(function(){
			var visiblePage = tabObj[$(this).attr('id')];
			$('.tab').removeClass('selected');
			$(this).addClass('selected');
			$('.tab-content').hide();
			$(visiblePage).show();
			if(visiblePage == '#settings'){
				$('.footer').hide()
			}
			else{
				$('.footer').show()
			}
		});
		$('.tab').keypress(function(e){
			 if (e.keyCode == 32){
				e.preventDefault();
		  		$(this).trigger('click');
	  		}
		});
		$('.title').keypress(function(e){
			if (e.keyCode == 32){
				e.preventDefault();
				$(this).find('img').trigger('click');
			}
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
					Must have a div with an id identical to id of this
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
		//Keyboard Shortcut Settings input{
		{

			var restoreButton = '<button class="shortcut-buttons">Restore default</button>';
			$('.shortcut-row').append('<td>' + restoreButton + '</td>');

			var codeBuffer = [];
			$('.shortcut-input').click(function(){
				this.select()
			});

			$('.shortcut-input').keydown(function (e) {
				if(!(functionKeys.hasOwnProperty(e.keyCode))){
					e.preventDefault();
					if(codeBuffer.length == 0){
						$(this).val('');
					}
					if(codeBuffer.indexOf(e.keyCode) < 0 & codeBuffer.length < 4){
						codeBuffer.push(e.keyCode);  
					}
					codeBuffer.sort((x,y) => {
							if(cmd.includes(x) & cmd.includes(y)){
								return cmd.indexOf(x) < cmd.indexOf(y) ? -1 : 1;
							}
							else{
								return cmd.includes(x) ? -1 : cmd.includes(y) ? 1 : 0;
							}
						});
					$(this).val(
						Array
						.from(codeBuffer, i => keyCodes[i])
						.join(' + ')
						);
					$(this).keyup(function(e){
						if(codeBuffer.length){
							$(this).siblings("input").val(codeBuffer);
							codeBuffer = [];
						}
					});
				}
			});

			$('.shortcut-buttons').click(function(){
				$(this).closest('tr').find('.shortcut-input').val('Restored!');
				return false;
			});

		}
	}
});