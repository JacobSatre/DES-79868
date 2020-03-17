/* IE remove function polyfill */
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('remove')) {
      return;
    }
    Object.defineProperty(item, 'remove', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove() {
        if (this.parentNode === null) {
          return;
        }
        this.parentNode.removeChild(this);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/* Accessibility Keyboard Controls */
$('.qfilter-category-toggle').on('keydown', function(e){
    if ($(this).attr('aria-expanded') === "false") {
        if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowDown" || e.key === "Down" || e.key === "Enter") {
            this.click();
            $(this).parent().find('[role="listbox"]').focus();
            e.preventDefault();
        }
    } else {
        if (e.key === " " || e.key === "Spacebar" || e.key === "ArrowDown" || e.key === "Down") {
            $(this).parent().find('[role="listbox"]').focus();
            e.preventDefault();
        }
    }
});

$(".quickFilterSearch [role=listbox]").on("focus", function () {
   /*  If no selected element, select the first by default */
   if (!$(this).find(".qfilter-selected").length) {               
        $(this).find("[role=option]:first").addClass("focused").focus();
   } else {
       $(this).find(".qfilter-selected:first").addClass('focused').focus();
   }
});

let keyboardSearchString = "";
let keyboardTimer;
$(".quickFilterSearch [role=listbox]").on("keydown", function (e) {            
    let currentItem = $(this).find(".focused");
    let currentFilter = $(this).attr('data-filter');
    let currentList = $('.qfilter-option[data-filter='+currentFilter+']');
    switch (e.key) {
        case 'Tab':  /* Tab */
            $(currentItem).on('blur', function(){
                currentItem.removeClass('focused');
            });
            break;
        case 'ArrowUp':  /*  Up arrow */
            if (currentItem.prev().length) {
                $(currentItem).on('blur', function(){
                    currentItem.removeClass('focused');
                });                
                currentItem.prev().addClass("focused").focus();
            }                    
            e.preventDefault();
            break;
        case 'Up':  /*  Up arrow */
            if (currentItem.prev().length) {
                $(currentItem).on('blur', function(){
                    currentItem.removeClass('focused');
                });                
                currentItem.prev().addClass("focused").focus();
            }                    
            e.preventDefault();
            break;
        case 'ArrowDown': /*  Down arrow */
            if (currentItem.next().length) {
                $(currentItem).on('blur', function(){
                    currentItem.removeClass('focused');
                }); 
                currentItem.next().addClass("focused").focus();
            }
            e.preventDefault();
            break;
        case 'Down': /*  Down arrow */
            if (currentItem.next().length) {
                $(currentItem).on('blur', function(){
                    currentItem.removeClass('focused');
                }); 
                currentItem.next().addClass("focused").focus();
            }
            e.preventDefault();
            break;
        case 'End': /* End */
            $(currentItem).on('blur', function(){
                currentItem.removeClass('focused');
            }); 
            currentList.last().addClass("focused").focus();
            e.preventDefault();
            break;
        case 'Home': /* Home */
            $(currentItem).on('blur', function(){
                currentItem.removeClass('focused');
            }); 
            currentList.first().addClass("focused").focus();
            e.preventDefault();
            break;
        case 'Escape': /* Escape */
            $(currentItem).parents('.qfilter-category').find('.qfilter-category-toggle').click().focus();
            e.preventDefault();
            break;
        case 'Esc': /* Escape */
            $(currentItem).parents('.qfilter-category').find('.qfilter-category-toggle').click().focus();
            e.preventDefault();
            break;
        default:
            clearTimeout(keyboardTimer);
            keyboardSearchString += e.key;
            keyboardTimer = setTimeout(function(){
                let filterText = new RegExp('^' + keyboardSearchString, 'i');
                for (let i = 0; i < currentList.length; i++) {
                    let currentText = $(currentList[i]).text();
                    if (filterText.test(currentText)) {
                        $(currentItem).on('blur', function(){
                            currentItem.removeClass('focused');
                        }); 
                        $(currentList[i]).addClass("focused").focus();
                        break;
                    }
                }
                keyboardSearchString = "";
            }, 250); 
    }
});

$(".quickFilterSearch [role=option]").on("focus", function (e) {
   $(this).parent().attr("tabindex", "-1");
});

$(".quickFilterSearch [role=option]").on("blur", function (e) {
   $(this).parent().attr("tabindex", "0");
});

/* Main Logic */
$(document).ready(function(){

    let submitList = $('.qfilter-submit'),
        href = $('.qfilter-submit').attr('href'),
        optionList = $('.qfilter-option'),
        overrideList = $('.qfilter-override'),
        categoryCount = $('.qfilter-categorycount'),
        inventoryCount = $('.qfilter-inventorycount');
        api = "/api/v2/search/#DEALERID#/filter";

    const qfilter = {
        "category": {
            "type": [],
            "year": [],
            "model": [],
            "make": [],
            "bodytype": [],
            "fueltype": [],
            "extcolor": [],
            "intcolor": [],
            "mileagerange": [],
            "citympgrange": [],
            "hwympgrange": [],
            "transmission": [],
            "features": [],
            "pricerange": [],
            "cylinders": [],
            "drivetraintype": [],
            "cpo": [],
            "carfax1owner": [],
            "special": []
        },
        "selectedCount": 0,
        getArray: function(index){
            let arrays = Object.values(qfilter.category);
            return arrays[index];
        },
        getKeys: function(){
            return Object.keys(qfilter.category);
        }
    }

    qfilter.sortOption = function(option, override) {

        let buttonCategory = option.dataset.filter;
        let buttonValue = option.dataset.value;
        let buttonText = option.textContent;

        if (!this.category[buttonCategory].includes(buttonValue)) {

            this.selectedCount++;

            this.category[buttonCategory].push(buttonValue);

            let categoryLength = this.category[buttonCategory].length;
            
            if (override != true) {
                qfilter.addElementSelection(buttonText, buttonValue, buttonCategory, categoryLength);
                qfilter.updateElementCount(buttonCategory, categoryLength);
            }


        } else {

            this.selectedCount--;
            this.category[buttonCategory] = this.category[buttonCategory].filter(function(value){
                return value != buttonValue;
            });

            let categoryLength = qfilter.category[buttonCategory].length;

            qfilter.removeElementSelection(buttonValue, buttonCategory, categoryLength);
            qfilter.updateElementCount(buttonCategory, categoryLength);

        }
    }

    /* builds query string */
    qfilter.buildQuery = function(){

        let queryString = "";
        let beginBuild = false;
        let keys = qfilter.getKeys();

        /* interate through each category */
        for (let i = 0; i < keys.length; i++) {

            let array = qfilter.getArray(i);
            if (array.length > 0) {

                /* place correct character between categories */
                if (beginBuild == false) {
                    queryString += "?";
                    beginBuild = true;
                } else {
                    queryString += "&";
                }

                /* compile filter values */
                let filterValues = "";
                let beginCount = false;
                for (let n = 0; n < array.length; n++) {
                    if (beginCount == true) {
                        filterValues += ",";
                    }
                    filterValues += array[n];
                    beginCount = true;
                }

                /* add category name and filter values to querystring */
                queryString += keys[i] + "=" + filterValues;
            }
        }

        /* encode URL */
        queryString = encodeURI(queryString);

        console.log(queryString);

        let apiString = "/api/v2/search/16790/filter" + queryString;

        /* add class until api request is returned */
        $(inventoryCount).addClass('qfilter-waitingapi');

        /* SEND API REQUEST */
        let inventorydata = $.ajax({
		    url: apiString,
		    type: 'GET',
		    dataType: 'json',
		    contentType: 'application/json'
		}).done(function() {
            /* update inventory count elements */
            for (let i = 0; i < inventoryCount.length; i++) {
                $(inventoryCount[i]).text(inventorydata.responseJSON.TotalHits);
            }

            /* disable submit button if count = 0 */
            if (inventorydata.responseJSON.TotalHits == 0) {
                $(submitList).attr('disabled',true).attr('title','No inventory, please select different filters').attr('aria-label','No inventory, please select different filters');
            } else {
                $(submitList).attr('disabled',false).removeAttr('title').removeAttr('aria-label');
            }

            /* api completed, remove class */
            $(inventoryCount).removeClass('qfilter-waitingapi');

            console.log(inventorydata.responseJSON.TotalHits);

        }).fail(function() {

            console.log( "Unable to retrieve inventory count" );

        }).always(function() {
        });

        /* update submit button href */
        $(submitList).attr('href', href + queryString);

        /* update qfilter selected count */
        $('.quickFilterSearch').attr('data-selected',qfilter.selectedCount);
    }

    /* adds current selections to the page as DOM elements */
    qfilter.addElementSelection = function(name, value, category, categoryLength) {

        /* define element ids */
        let valueid = "qfilter-current" + "-" + category + "-" + encodeURIComponent(value);
        let categoryid = "qfilter-current" + "-" + category;

        /* category (parent element) */
        let categoryelement = document.createElement("li");

        /* add ids and classes */
        categoryelement.setAttribute('id', categoryid);
        categoryelement.setAttribute('class', 'qfilter-current-category');

        /* label (child element) */
        let labelelement = document.createElement("span");
        let labelcontent = document.createTextNode(category + ":");
        /* add ids and classes */
        labelelement.setAttribute('class', 'qfilter-current-label');
        labelelement.appendChild(labelcontent);

        /* value (child element) */
        let valueelement = document.createElement("span");
        let valuecontent = document.createTextNode(name);

        /* add ids and classes */
        valueelement.setAttribute('id', valueid);
        valueelement.setAttribute('class', 'qfilter-current-value text-cta');
        valueelement.setAttribute('data-filter', category);
        valueelement.setAttribute('data-value', value);
        valueelement.appendChild(valuecontent);
        valueelement.addEventListener("click", function() { qfilter.cancelElementSelection(this); });

        /* add correct element(s) */
        if (categoryLength == 1) {
            document.getElementById('qfilter-current').appendChild(categoryelement);
            categoryelement.appendChild(labelelement);
            categoryelement.appendChild(valueelement);
        } else {
            document.getElementById(categoryid).appendChild(valueelement);
        }
    }

    /* removes current selections DOM elements from page */
    qfilter.removeElementSelection = function(value, category, categoryLength) {

        /* define element ids */
        let valueid = "qfilter-current" + "-" + category + "-" + encodeURIComponent(value);

        let categoryid = "qfilter-current" + "-" + category;

        /* category (parent element) */
        let categoryelement = document.getElementById(categoryid);

        /* value (child element) */
        let valueelement = document.getElementById(valueid);
        valueelement.removeEventListener("click", function() { qfilter.cancelElementSelection(this); });

        /* remove correct element(s) */
        if (categoryLength == 0) {
            categoryelement.remove();
        } else {
            valueelement.remove();
        }
    }

    /* click to remove current filters */
    qfilter.cancelElementSelection = function(option){

        let value = option.dataset.value;
        let filter = option.dataset.filter;

        /* remove selected class from the correct option button */
        for (let i = 0; i < optionList.length; i++) {
            if (optionList[i].dataset.value.toUpperCase() == value.toUpperCase() && optionList[i].dataset.filter.toUpperCase() == filter.toUpperCase()) {
                $(optionList[i]).removeClass('qfilter-selected');
                $(optionList[i]).attr('aria-selected','false');
            }
        }

        qfilter.sortOption(option, false);
        qfilter.buildQuery();
    }

    qfilter.cancelAllFilters = function() {
        let currentFilters = $('.qfilter-selected');
        for (let i = 0; i < currentFilters.length; i++) {
            qfilter.sortOption(currentFilters[i], false);
            $(currentFilters[i]).removeClass('qfilter-selected');
            $(currentFilters[i]).attr('aria-selected','false');
        }
        qfilter.buildQuery();
    }

    /* updates category count elements */
    qfilter.updateElementCount = function(category, categoryLength) {
        for (let i = 0; i < categoryCount.length; i++) {
            if (categoryCount[i].dataset.filter.toUpperCase() == category.toUpperCase()) {
                if (categoryLength > 0) {
                    $(categoryCount[i]).text('(' + categoryLength + ')');
                } else {
                    $(categoryCount[i]).text('');
                }
            }
        }
    }

    /* process option clicks */
    $('.qfilter-option').click(function() {
        if ($(this).attr('aria-selected') == 'false') {
            $(this).attr('aria-selected','true');
        } else {
            $(this).attr('aria-selected','false');
        }
        $(this).toggleClass('qfilter-selected');
        qfilter.sortOption(this, false);
        qfilter.buildQuery();
    });
    $(".qfilter-option").on('keypress', function(e) {
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter'){
            if ($(this).attr('aria-selected') == 'false') {
                $(this).attr('aria-selected','true');
            } else {
                $(this).attr('aria-selected','false');
            }
            $(this).toggleClass('qfilter-selected');
            qfilter.sortOption(this, false);
            qfilter.buildQuery();

            e.preventDefault();
        }
    });

    /* process reset filters clicks */
    $('.qfilter-reset').click(function() {
        $('#qfilter-buttons').find('.qfilter-category-toggle').first().focus();
        qfilter.cancelAllFilters();
    });
    $(".qfilter-reset").on('keypress', function(e) {
        if (e.key === ' ' || e.key === 'Enter'){
            qfilter.cancelAllFilters();
            e.preventDefault();
        }
    });
    
    /* gather override filters */
    for (let i = 0; i < overrideList.length; i++) {
        qfilter.sortOption(overrideList[i], true);
        qfilter.buildQuery();
    }

    /* prevent search if button is disabled */
    $(submitList).click(function(event){
        if ($(submitList[0]).attr('disabled') == "disabled") {
            event.preventDefault();
        }
    });

    /* initial query */
    qfilter.buildQuery();
    console.log("building initial query");
});
