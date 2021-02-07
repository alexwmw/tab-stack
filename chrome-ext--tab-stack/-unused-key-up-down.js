//Key event handler
    // up and down arrow keys
    $(document).keydown(function(e){
        var currentRow = $('.selected').first();
        var y = $('#results-area').scrollTop();
        var lastRes = $(currentRow).is(':last-child');
        var firstRes = $(currentRow).is(':first-child');

        // The target scroll position = number of rows
        //      if in the top 7 of bottom 7 rows, do nothing (0)
        //      else set target to 45 or -45
        var targetY = 
            $(currentRow).is(':visible:nth-child(n+7)') ? 45 :
            $(currentRow).is(':visible:nth-last-child(-n+6)') ? -45 : 
            0;

        // If UP or DOWN pressed
        if (e.which == 40 || e.which == 38) {    //40 up, 38 down
            e.preventDefault();
            do {
                // Unselect the current row
                $(currentRow).toggleClass('selected'); 

                if(e.which == 40) //DOWN press
                {
                    if(lastRes){    // if lastRes & DOWN press, jump to top
                        targetY = $('.result').length * -45;
                    }
                    // Set the next currentRow.
                    //      If last row, go to top.
                    //      Otherwise go to next.
                    currentRow = lastRes ? 
                        currentRow = $('.result:visible').first() : 
                        $(currentRow).next('tr');
                }
                else //UP press 
                {  
                    if(firstRes){    // if firstRes & UP press, jump to bottom
                        targetY = $('.result').length * 45;
                    }
                    // Set the next currentRow.
                    //      If first row, go to last.
                    //      Otherwise go to prev.
                    currentRow = firstRes ? 
                        currentRow = $('.result').last() : 
                        $(currentRow).prev('tr');
                }
                $('#results-area').scrollTop(y+targetY);
                $(currentRow).toggleClass('selected')
            }
            while(currentRow.is(':hidden'))
        }
    })