$(document).ready(function() {

    //retrieve and cache submit button hrefs
    let overrideList = $('.qfilter-override');
    let submitList = $('.qfilter-submit');
    let hrefList = [];
    for (let i = 0; i < submitList.length; i++) {
        hrefList.push(submitList[i].getAttribute('href'));
    }

    //retrieve category count element list
    let categoryCount = $('.qfilter-categorycount');

    //retrieve option button list
    let optionList = $('.qfilter-option');

    //retrieve inventory count element list
    let inventoryCount = $('.qfilter-inventorycount');

    //categories
    let type = { filterName: "Type", filterValues: [] };
    let year = { filterName: "Year", filterValues: [] };
    let model = { filterName: "Model", filterValues: [] };
    let make = { filterName: "Make", filterValues: [] };
    let bodystyle = { filterName: "Bodystyle", filterValues: [] };
    let fueltype = { filterName: "Fueltype", filterValues: [] };
    let extcolor = { filterName: "ExtColor", filterValues: [] };
    let mpgcity = { filterName: "CityMpgrange", filterValues: [] };
    let mpghighway = { filterName: "HwyMpgrange", filterValues: [] };
    let transmission = { filterName: "Transmission", filterValues: [] };
    let features = { filterName: "Features", filterValues: [] };
    let pricerange = { filterName: "Pricerange", filterValues: [] };
    let cylinders = { filterName: "Cylinders", filterValues: [] };
    let drivetraintype = { filterName: "DriveTrainType", filterValues: [] };
    let cpo = { filterName: "cpo", filterValues: [] };
    let carfax1owner = { filterName: "carfax1owner", filterValues: [] };
    let special = { filterName: "special", filterValues: [] };

    //categories list
    const categories = [type, year, model, make, bodystyle, fueltype, extcolor, mpgcity, mpghighway, transmission, features, pricerange, cylinders, drivetraintype, cpo, carfax1owner, special];

    //manages options/filters
    function sortFilter(option, override) {

        let sortFilterError = true;

        //interate through each category
        for (let i = 0; i < categories.length; i++) {
            if (option.dataset.filter.toUpperCase() == categories[i].filterName.toUpperCase()) {

                //if category doesn't include option, add it
                if (categories[i].filterValues.includes(option.dataset.value) == false) {
                    categories[i].filterValues.push(option.dataset.value);

                    //update page elements
                    if (override != true) {
                    addCurrentFilter($(option).text(), option.dataset.value, categories[i].filterName, categories[i].filterValues.length);
                    updateCategoryCount(categories[i].filterName, categories[i].filterValues.length);
                    }

                    sortFilterError = false;

                //if category includes option, find and remove it
                } else {
                    for (let n = 0; n < categories[i].filterValues.length; n++) {
                        if (categories[i].filterValues[n] == option.dataset.value) {
                            categories[i].filterValues.splice(n, 1);

                            //update page elements
                            removeCurrentFilter(option.dataset.value, categories[i].filterName, categories[i].filterValues.length);
                            updateCategoryCount(categories[i].filterName, categories[i].filterValues.length);

                            sortFilterError = false;
                        }
                    }
                }
            }
        }

        //log errors
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
        apiString = "/api/search/refine" + queryString

        //SEND API REQUEST
        let inventory = $.get(apiString, function() {

            console.log( "sending API request ("+apiString+")");

          }).done(function() {

            console.log(inventory.responseJSON.Count);

          }).fail(function() {

            console.log( "Unable to retrieve inventory count" );

          }).always(function() {
            $(submitList).attr('disabled', false);

            for (let i = 0; i < inventoryCount.length; i++) {
                $(inventoryCount[i]).text("("+inventory.responseJSON.Count+")");
            }

            if (inventory.responseJSON.Count == 0) {
                $(submitList).attr('disabled', true);
            }

          });

        //update submit button href
        for (let i = 0; i < submitList.length; i++) {
            $(submitList[i]).attr('href', hrefList[i] + queryString);
        }
    }

    //adds current selections to the page as DOM elements
    function addCurrentFilter(name, value, category, categoryLength) {

        //define element ids
        let valueid = "qfilter-current" + "-" + category + "-" + encodeURIComponent(value);
        let categoryid = "qfilter-current" + "-" + category;

        //category (parent element)
        let categoryelement = document.createElement("p");

        //add ids and classes
        categoryelement.setAttribute('id', categoryid);
        categoryelement.setAttribute('class', 'qfilter-current-category');

        //label (child element)
        let labelelement = document.createElement("span");
        let labelcontent = document.createTextNode(category + ":");
        //add ids and classes
        labelelement.setAttribute('class', 'qfilter-current-label');
        labelelement.appendChild(labelcontent);

        //value (child element)
        let valueelement = document.createElement("span");
        let valuecontent = document.createTextNode(name);

        //add ids and classes
        valueelement.setAttribute('id', valueid);
        valueelement.setAttribute('class', 'qfilter-current-value btn btn-main');
        valueelement.setAttribute('data-filter', category);
        valueelement.setAttribute('data-value', value);
        valueelement.appendChild(valuecontent);
        valueelement.addEventListener("click", function() { cancelCurrentFilter(this) });

        //add correct elements
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
        valueelement.removeEventListener("click", function() { cancelCurrentFilter(this) });

        //remove correct elements
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
            }
        }

        sortFilter(option);
        buildQuery();
    }

    //updates category count elements
    function updateCategoryCount(category, categoryLength) {
        for (let i = 0; i < categoryCount.length; i++) {
            if (categoryCount[i].dataset.filter.toUpperCase() == category.toUpperCase()) {
                if (categoryLength > 0) {
                    $(categoryCount[i]).text('(' + categoryLength + ')')
                } else {
                    $(categoryCount[i]).text('');
                }
            }
        }
    }

    //gather override filters
    for (let i = 0; i < overrideList.length; i++) {
        sortFilter(overrideList[i], true);
        buildQuery();
    }

    //onclick
    buildQuery();
    $('.qfilter-option').click(function() {
        $(this).toggleClass('qfilter-selected');
        sortFilter(this);
        buildQuery();
    });
});
