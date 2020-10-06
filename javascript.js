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
    let currentList = $('.qfilter-button[data-filter='+currentFilter+']');
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
        sortOption: function(button, override) {

            let buttonCategory = button.dataset.filter;
            let buttonValue = button.dataset.value;
            let buttonText = button.textContent;
            console.log("category is " + buttonCategory);
            console.log(qfilter.category[buttonCategory]);

            if (!qfilter.category[buttonCategory].includes(buttonValue)) {

                qfilter.category[buttonCategory].push(buttonValue);

                let categoryLength = qfilter.category[buttonCategory].length;
                
                if (override != true) {
                    qfilter.selectedCount++;
                    addElementSelection(buttonText, buttonValue, buttonCategory, categoryLength);
                    updateElementCount(buttonCategory, categoryLength);
                }


            } else {

                qfilter.selectedCount--;
                qfilter.category[buttonCategory] = qfilter.category[buttonCategory].filter(function(value){return value != buttonValue;});

                let categoryLength = qfilter.category[buttonCategory].length;

                removeElementSelection(buttonValue, buttonCategory, categoryLength);
                updateElementCount(buttonCategory, categoryLength);

            }
        },
        buildQuery: function(){

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

            return queryString;
        },
        getArray: function(index){
            let arrays = Object.values(qfilter.category);
            return arrays[index];
        },
        getKeys: function(){
            return Object.keys(qfilter.category);
        }
    }

    function getButtons() {
        queryString = qfilter.buildQuery();

        let apiString = api + queryString;

        let testData = $.ajax({
            url: apiString,
            type: 'GET',
            dataType: 'json',
            contentType: 'application/json'
        }).done(function() {

            let categoryList = $('.qfilter-button-container');

            for (let i = 0; i < categoryList.length; i++) {
                let categoryFilter = $(categoryList[i]).attr('data-filter');
                if (categoryFilter == "type") {
                    addButton(categoryList[i], "type", "n", "New");
                    addButton(categoryList[i], "type", "u", "Used");
                } else if (categoryFilter == "year") {
                    let optionList = Object.keys(testData.responseJSON.YearBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "year", optionList[n]);
                    }
                }
                else if (categoryFilter == "model") {
                    let optionList = Object.keys(testData.responseJSON.ModelBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "model", optionList[n]);
                    }
                }
                else if (categoryFilter == "make") {
                    let optionList = Object.keys(testData.responseJSON.MakeBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "make", optionList[n]);
                    }
                }
                else if (categoryFilter == "bodytype") {
                    let optionList = Object.keys(testData.responseJSON.BodyTypeBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "bodytype", optionList[n]);
                    }
                }
                else if (categoryFilter == "fueltype") {
                    let optionList = Object.keys(testData.responseJSON.FueltypeBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "fueltype", optionList[n]);
                    }
                }
                else if (categoryFilter == "extcolor") {
                    let optionList = Object.keys(testData.responseJSON.ExtColorBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "extcolor", optionList[n]);
                    }
                }
                else if (categoryFilter == "transmission") {
                    let optionList = Object.keys(testData.responseJSON.TransmissionBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "transmission", optionList[n]);
                    }
                }
                else if (categoryFilter == "features") {
                    let optionList = Object.keys(testData.responseJSON.FeaturesBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "features", optionList[n]);
                    }
                }
                else if (categoryFilter == "cylinders") {
                    let optionList = Object.keys(testData.responseJSON.CylinderBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "cylinders", optionList[n]);
                    }
                }
                else if (categoryFilter == "drivetraintype") {
                    let optionList = Object.keys(testData.responseJSON.DrivetrainTypeBuckets);
                    for (let n = 0; n < optionList.length; n++) {
                        addButton(categoryList[i], "drivetraintype", optionList[n]);
                    }
                }
            }

            /* process option clicks */
            $('.qfilter-button').click(function() {
                console.log("button clicked");
                if ($(this).attr('aria-selected') == 'false') {
                    $(this).attr('aria-selected','true');
                } else {
                    $(this).attr('aria-selected','false');
                }
                $(this).toggleClass('qfilter-selected');
                qfilter.sortOption(this, false);
                getResults();
            });
            $('.qfilter-button').on('keypress', function(e) {
                console.log("button clicked");
                if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'Enter'){
                    if ($(this).attr('aria-selected') == 'false') {
                        $(this).attr('aria-selected','true');
                    } else {
                        $(this).attr('aria-selected','false');
                    }
                    $(this).toggleClass('qfilter-selected');
                    qfilter.sortOption(this, false);
                    getResults();

                    e.preventDefault();
                }
            });

            console.log('buttons have been generated');

            getResults();

        }).fail(function() {

            console.log( "Unable to retrieve inventory count from " + APIurl );

        }).always(function() {
        });
    }

    function addButton(parent, filter, value, text) {
        let option = document.createElement("li");

        option.setAttribute('class','qfilter-button text-cta');
        option.setAttribute('data-filter', filter);
        option.setAttribute('data-value', value);
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', 'false');
        option.setAttribute('tabindex', '-1');

        if (text) {
            optiontext = document.createTextNode(text);
        } else {
            optiontext = document.createTextNode(value);
        }
        option.appendChild(optiontext);
        parent.appendChild(option);
    }

    function getResults() {

        queryString = qfilter.buildQuery();

        let apiString = api + queryString;

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

        console.log("results have been returned");
    }

    /* adds current selections to the page as DOM elements */
    function addElementSelection(name, value, category, categoryLength) {

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
        valueelement.addEventListener("click", function() { cancelElementSelection(this); });

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
    function removeElementSelection(value, category, categoryLength) {

        /* define element ids */
        let valueid = "qfilter-current" + "-" + category + "-" + encodeURIComponent(value);

        let categoryid = "qfilter-current" + "-" + category;

        /* category (parent element) */
        let categoryelement = document.getElementById(categoryid);

        /* value (child element) */
        let valueelement = document.getElementById(valueid);
        valueelement.removeEventListener("click", function() { cancelElementSelection(this); });

        /* remove correct element(s) */
        if (categoryLength == 0) {
            categoryelement.remove();
        } else {
            valueelement.remove();
        }
    }

    /* click to remove current filters */
    function cancelElementSelection(button){
        let selectedList = $('.qfilter-selected');
        let value = button.dataset.value;
        let filter = button.dataset.filter;

        /* remove selected class from the correct option button */
        for (let i = 0; i < selectedList.length; i++) {
            if (selectedList[i].dataset.value == value && selectedList[i].dataset.filter == filter) {
                $(selectedList[i]).removeClass('qfilter-selected');
                $(selectedList[i]).attr('aria-selected','false');
            }
        }

        qfilter.sortOption(button, false);
        getResults();
    }

    function clearFilters() {
        let currentFilters = $('.qfilter-selected');
        for (let i = 0; i < currentFilters.length; i++) {
            qfilter.sortOption(currentFilters[i], false);
            $(currentFilters[i]).removeClass('qfilter-selected');
            $(currentFilters[i]).attr('aria-selected','false');
        }
        getResults();
    }

    /* updates category count elements */
    function updateElementCount(category, categoryLength) {
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

    /* process reset filters clicks */
    $('.qfilter-reset').click(function() {
        console.log("reset button clicked");
        $('#qfilter-buttons').find('.qfilter-category-toggle').first().focus();
        clearFilters();
    });
    $(".qfilter-reset").on('keypress', function(e) {
        console.log("reset button clicked");
        if (e.key === ' ' || e.key === 'Enter'){
            clearFilters();
            e.preventDefault();
        }
    });
    
    /* gather override filters */
    for (let i = 0; i < overrideList.length; i++) {
        qfilter.sortOption(overrideList[i], true);
        $('.qfilter-button-container[data-filter='+overrideList[i].dataset.filter+']').parents('.qfilter-category').remove();

    }

    /* prevent search if button is disabled */
    $(submitList).click(function(event){
        if ($(submitList[0]).attr('disabled') == "disabled") {
            event.preventDefault();
        }
    });

    getButtons();
});
