$(document).ready(function(){

	const keyCodes = {
		0: '',
		3: 'break',
		8: 'backspace',
		9: 'tab',
		12: 'clear',
		13: 'enter',
		16: 'shift',
		17: 'ctrl',
		18: 'alt',
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
		91: '\u2318',
		92: 'right window key',
		93: '\u2318',
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
			var codes = [];
			var sympress = 0;



			$('.shortcut-input').keydown(function (e) {
				e.preventDefault();
				if(sympress == 0){
					$(this).val('');
					codes = [];
				}
				sympress++;
				codes.push(keyCodes[e.keyCode]);  
				$(this).val(codes.sort().join(' + '));
				$(this).keyup(function(e){
					sympress = 0;
				});
				return false;

				
			});


		}
	}
});