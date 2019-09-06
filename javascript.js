$(document).ready(function() {

        //retrieve submit button list
    let submitList = $('.qfilter-submit'),
        href = $('.qfilter-submit').attr('href'),

        //retrieve option button list
        optionList = $('.qfilter-option'),

        //retrieve override element list
        overrideList = $('.qfilter-override'),

        //retrieve category count element list
        categoryCount = $('.qfilter-categorycount'),

        //retrieve inventory count element list
        inventoryCount = $('.qfilter-inventorycount');

    //categories
    let type = { filterName: "Type", filterValues: [] },
        year = { filterName: "Year", filterValues: [] },
        model = { filterName: "Model", filterValues: [] },
        make = { filterName: "Make", filterValues: [] },
        bodystyle = { filterName: "Bodystyle", filterValues: [] },
        bodytype = { filterName: "Bodytype", filterValues: [] },
        fueltype = { filterName: "Fueltype", filterValues: [] },
        extcolor = { filterName: "ExtColor", filterValues: [] },
        intcolor = { filterName: "IntColor", filterValues: [] },
        mileage = { filterName: "Mileagerange", filterValues: [] },
        mpgcity = { filterName: "CityMpgrange", filterValues: [] },
        mpghighway = { filterName: "HwyMpgrange", filterValues: [] },
        transmission = { filterName: "Transmission", filterValues: [] },
        features = { filterName: "Features", filterValues: [] },
        pricerange = { filterName: "Pricerange", filterValues: [] },
        cylinders = { filterName: "Cylinders", filterValues: [] },
        drivetraintype = { filterName: "DriveTrainType", filterValues: [] },
        cpo = { filterName: "cpo", filterValues: [] },
        carfax1owner = { filterName: "carfax1owner", filterValues: [] },
        special = { filterName: "special", filterValues: [] };

    //categories list
    const categories = [type, year, model, make, bodystyle, bodytype, fueltype, extcolor, intcolor, mileage, mpgcity, mpghighway, transmission, features, pricerange, cylinders, drivetraintype, cpo, carfax1owner, special];

    let selectedCount = 0;

    //manages options/filters
    function sortFilter(option, override) {

        //category sorting error toggle switch
        let sortFilterError = true;

        //interate through each category
        for (let i = 0; i < categories.length; i++) {
            if (option.dataset.filter.toUpperCase() == categories[i].filterName.toUpperCase()) {

                //if category doesn't include option, add it
                if (categories[i].filterValues.includes(option.dataset.value) == false) {
                    categories[i].filterValues.push(option.dataset.value);

                    selectedCount++;

                    //update page elements
                    if (override != true) {
                        addCurrentFilter($(option).text(), option.dataset.value, categories[i].filterName, categories[i].filterValues.length);
                        updateCategoryCount(categories[i].filterName, categories[i].filterValues.length);
                    }

                    //no problems
                    sortFilterError = false;

                //if category includes option, find and remove it
                } else {

                    selectedCount--;

                    for (let n = 0; n < categories[i].filterValues.length; n++) {
                        if (categories[i].filterValues[n] == option.dataset.value) {
                            categories[i].filterValues.splice(n, 1);

                            //update page elements
                            removeCurrentFilter(option.dataset.value, categories[i].filterName, categories[i].filterValues.length);
                            updateCategoryCount(categories[i].filterName, categories[i].filterValues.length);

                            //no problems
                            sortFilterError = false;
                        }
                    }
                }
            }
        }

        //log category errors
        if (sortFilterError == true) {
            console.log("qfilter error at button '"+$(option).text()+"': '"+option.dataset.filter+"' is not a recognized category");
        }
    }

    //builds query string
    function buildQuery() {

        let queryString = "";
        let beginBuild = false;

        //interate through each category
        for (let i = 0; i < categories.length; i++) {
            if (categories[i].filterValues.length > 0) {

                //place correct character between categories
                if (beginBuild == false) {
                    queryString += "?";
                    beginBuild = true;
                } else {
                    queryString += "&";
                }

                //compile filter values
                let filterValues = "";
                let beginCount = false;
                for (let n = 0; n < categories[i].filterValues.length; n++) {
                    if (beginCount == true) {
                        filterValues += ",";
                    }
                    filterValues += categories[i].filterValues[n];
                    beginCount = true;
                }

                //add category name and filter values to querystring
                queryString += categories[i].filterName + "=" + filterValues;
            }
        }

        //encode URL
        queryString = encodeURI(queryString);

        let apiString = "/api/search/refine" + queryString;

        //add class until api request is returned
        $(inventoryCount).addClass('qfilter-waitingapi');

        //SEND API REQUEST
        let inventorydata = $.get(apiString, function() {

            console.log( "sending API request ("+apiString+")");
            
        }).done(function() {

            //update inventory count elements
            for (let i = 0; i < inventoryCount.length; i++) {
                $(inventoryCount[i]).text(inventorydata.responseJSON.Count);
            }

            //disable submit button if count = 0
            if (inventorydata.responseJSON.Count == 0) {
                $(submitList).attr('disabled',true).attr('title','No inventory, please select different filters').attr('aria-label','No inventory, please select different filters');
            } else {
                $(submitList).attr('disabled',false).removeAttr('title').removeAttr('aria-label');
            }

            //api completed, remove class
            $(inventoryCount).removeClass('qfilter-waitingapi');

            console.log(inventorydata.responseJSON.Count);

        }).fail(function() {

            console.log( "Unable to retrieve inventory count" );

        }).always(function() {
        });

        //update submit button href
        $(submitList).attr('href', href + queryString);

        //update qfilter selected count
        $('.quickFilterSearch').attr('data-selected',selectedCount);
    }

    //adds current selections to the page as DOM elements
    function addCurrentFilter(name, value, category, categoryLength) {

        //define element ids
        let valueid = "qfilter-current" + "-" + category + "-" + encodeURIComponent(value);
        let categoryid = "qfilter-current" + "-" + category;

        //category (parent element)
        let categoryelement = document.createElement("li");

        //add ids and classes
        categoryelement.setAttribute('id', categoryid);
        categoryelement.setAttribute('class', 'qfilter-current-category');

        //label (child element)
        let labelelement = document.createElement("span");
        let labelcontent = document.createTextNode(category + ":");
        //add ids and classes
        labelelement.setAttribute('class', 'qfilter-current-label  text-cta');
        labelelement.appendChild(labelcontent);

        //value (child element)
        let valueelement = document.createElement("span");
        let valuecontent = document.createTextNode(name);

        //add ids and classes
        valueelement.setAttribute('id', valueid);
        valueelement.setAttribute('class',   'qfilter-current-value');
        valueelement.setAttribute('data-filter', category);
        valueelement.setAttribute('data-value', value);
        valueelement.appendChild(valuecontent);
        valueelement.addEventListener("click", function() { cancelCurrentFilter(this); });

        //add correct element(s)
        if (categoryLength == 1) {
            document.getElementById('qfilter-current').appendChild(categoryelement);
            categoryelement.appendChild(labelelement);
            categoryelement.appendChild(valueelement);
        } else {
            document.getElementById(categoryid).appendChild(valueelement);
        }
    }

    ////removes current selections DOM elements from page
    function removeCurrentFilter(value, category, categoryLength) {

        //define element ids
        let valueid = "qfilter-current" + "-" + category + "-" + encodeURIComponent(value);
        let categoryid = "qfilter-current" + "-" + category;

        //category (parent element)
        let categoryelement = document.getElementById(categoryid);

        //value (child element)
        let valueelement = document.getElementById(valueid);
        valueelement.removeEventListener("click", function() { cancelCurrentFilter(this); });

        //remove correct element(s)
        if (categoryLength == 0) {
            categoryelement.remove();
        } else {
            valueelement.remove();
        }
    }

    //click to remove current filters
    function cancelCurrentFilter(option) {

        let value = option.dataset.value;
        let filter = option.dataset.filter;

        //remove selected class from the correct option button
        for (let i = 0; i < optionList.length; i++) {
            if (optionList[i].dataset.value.toUpperCase() == value.toUpperCase() && optionList[i].dataset.filter.toUpperCase() == filter.toUpperCase()) {
                $(optionList[i]).removeClass('qfilter-selected');
                $(optionList[i]).attr('aria-checked','false');
            }
        }

        sortFilter(option);
        buildQuery();
    }

    function cancelAllFilters() {
        let currentFilters = $('.qfilter-selected');
        for (let i = 0; i < currentFilters.length; i++) {
            sortFilter(currentFilters[i]);
            $(currentFilters[i]).removeClass('qfilter-selected');
            $(currentFilters[i]).attr('aria-checked','false');
        }
        buildQuery();
    }

    //updates category count elements
    function updateCategoryCount(category, categoryLength) {
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

    //process option clicks
    $('.qfilter-option').click(function() {
        if ($(this).attr('aria-checked') == 'false') {
            $(this).attr('aria-checked','true');
        } else {
            $(this).attr('aria-checked','false');
        }
        $(this).toggleClass('qfilter-selected');
        sortFilter(this);
        buildQuery();
    });

    //process spacebar and enter presses (accessibility)
    $(".qfilter-option").keypress(function() {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13' || keycode == '32'){
            if ($(this).attr('aria-checked') == 'false') {
                $(this).attr('aria-checked','true');
            } else {
                $(this).attr('aria-checked','false');
            }
            $(this).toggleClass('qfilter-selected');
            sortFilter(this);
            buildQuery();
        }
    });

    //process spacebar and enter presses (accessibility)
    $(".qfilter-reset").keypress(function() {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == '13' || keycode == '32'){
            cancelAllFilters();
        }
    });

    //process reset filters clicks
    $('.qfilter-reset').click(function() {
        cancelAllFilters();
    });

    //gather override filters
    for (let i = 0; i < overrideList.length; i++) {
        sortFilter(overrideList[i], true);
        buildQuery();
    }

    //prevent search if button is disabled
    $(submitList).click(function(event){
        if ($(submitList[0]).attr('disabled') == "disabled") {
            event.preventDefault();
        }
    });

    //initial query
    buildQuery();
});
