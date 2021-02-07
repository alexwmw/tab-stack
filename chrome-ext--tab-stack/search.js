$(document).ready(function(){
    
    // Get Open Tabs
    var openTabs = [];
    chrome.tabs.query({}, tabs => {
        openTabs = tabs;
        //displayTabs();
        });

        
        function displayTabs() {
            document.getElementById('results-table')
              .append(...openTabs.map(createTabElement));
          }
        
          function createTabElement(tab) {
            const row = document.createElement('tr');
            const fav = document.createElement('td');
            const info = document.createElement('td');
            const title = document.createElement('span');
            const url = document.createElement('span');
            const br = document.createElement('br');
            const fav_img = document.createElement('img');
            
            row.classList.add('result');
            title.classList.add('tab-title');
            url.classList.add('tab-domain');
            url.textContent = tab.url;
            title.textContent = tab.title;
            fav_img.setAttribute('src', tab.favIconUrl);
            fav.append(fav_img)
            title.append(br);
            info.append(title, url);
            row.append(fav, info);
            return row;
          }


 
    function NewResultEl(){
        var tr_result = document.createElement('tr').classList.add('result');
        //var td_favicon = document.createElement('td').classList.add('favicon');
        //var td_tab_info = document.createElement('td').classList.add('tab-info');
        //var td_opt1 = document.createElement('td').classList.add('opt1');
        //var td_opt2 = document.createElement('td').classList.add('opt2');

        //var img_favicon = document.createElement('img').classList.add('img-favicon');
        //var span_tab_title = document.createElement('span').classList.add('tab-title');
        //var span_tab_domain = document.createElement('span').classList.add('tab-domain');
        //var i_opt1 = document.createElement('i').classList.add('fa', 'fa-lg');
        //var i_opt2 = document.createElement('i').classList.add('fa');

        $(tr_result).append(td_favicon, td_tab_info, td_opt1, td_opt2);
        $(td_favicon).append(img_favicon);
        $(td_tab_info).append(span_tab_title,span_tab_domain);
        $(td_opt1).append(i_opt1);
        $(td_opt2).append(i_opt2);

        return tr_result;
    }

    function CreateOpenTabResult(tab){
        var tr_res = NewResultEl();
        $('#results-table').append(tr_res);
        $('.result .img-favicon').last().attr('src', tab.favIconUrl);
        $('.result .tab-title').last().text(tab.title);
        $('.result .tab-domain').last().text(tab.url);
        $('.result .i_opt1').last().addClass('fa-unlock');
        $('.result .i_opt2').last().addClass('fa-times');
    }


    function ChangeSelectedTo(selection){
        $('.selected').removeClass('selected');
        selection.addClass('selected');
    }

    // Select the first result
    $('.result').first().addClass('selected');


    // When click on .result
    $('.result').click(function(){

        ChangeSelectedTo($(this));

        //Then Open link
        
    });

    

    // Toggle lock class on result rows
    $('i.fa-unlock').click(function(){
        $(this).toggleClass('fa-lock');
        $(this).toggleClass('fa-unlock');
        $(this).closest('.result').toggleClass('locked');
    });

    // Search
    var searchterm = '';
    $('#searchbox').on('keyup',function(){
        // get the value currently in searchbox
        searchterm = $(this).val().toLowerCase();
        // Filter the results
        $(".result").filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(searchterm) > -1)
        });
        //Re-set the selected result
        if($('.selected').first().is(":hidden") || !$('.selected').length){
            ChangeSelectedTo( $('.result:visible').first() );
        }
    });



});
